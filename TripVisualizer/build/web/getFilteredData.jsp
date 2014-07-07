<%@page import="java.util.List"%>
<%@page import="java.util.ArrayList"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.HashMap"%>
<%@page import="tripVisualizerPkg.helperClass"%>
<%@page import="tripVisualizerPkg.connection"%>
<%@page contentType="text/html; charset=UTF-8"%>
<%@page import="java.sql.*"%>
<%@page import="org.json.simple.JSONObject"%>
<%
    boolean error = false;
    boolean debug_output_request = false;
    boolean debug_output_query = false;
    
    if (debug_output_request) {
        JSONObject tmpJson = new JSONObject();

        Map<String, String[]> parameters = request.getParameterMap();
        for (String parameter : parameters.keySet()) {
            String val = request.getParameter(parameter);
            tmpJson.put(parameter, val);
        }
        out.print(tmpJson);
        out.flush();
    }

    // PREPARE STRUCTURE
    List<HashMap<String, String>> Trips = new ArrayList<HashMap<String, String>>();

    try {
        Class.forName("org.postgresql.Driver");
    } catch (ClassNotFoundException e) {
        JSONObject errorJson = new JSONObject();
        errorJson.put("error", "Error while searching class for org.postgresql.Driver");
        errorJson.put("errorMessage", e.getMessage());
        error = true;
        out.print(errorJson);
        out.flush();
    }

    if (!error) {
        try {
            //####### CREATE CONNECTION #######
            String URL = connection.URL;
            String USER = connection.USER;
            String PASS = connection.PASS;
            Connection conn = DriverManager.getConnection(URL, USER, PASS);
            helperClass.requestHandler R = new helperClass.requestHandler(request);

            //####### BUILD QUERY #######
            ArrayList<helperClass.VarTypes> types = new ArrayList<helperClass.VarTypes>();
            StringBuilder whereCondition = new StringBuilder();
            ArrayList<String> valuesForConditions = new ArrayList<String>();
            boolean needToDelLastChar = false;

            // FILTERING BY ID 
            // trip_id and agent_id wont be used ...

            if (R.isSet("trip_id") && R.isInt("trip_id")) {
                whereCondition.append("t.trip_id = ? AND ");
                valuesForConditions.add(request.getParameter("trip_id"));
                types.add(helperClass.VarTypes.IntVar);
                needToDelLastChar = true;
            }

            if (R.isSet("agent_id")) {
                whereCondition.append("a.agent_id = ? AND ");
                valuesForConditions.add(request.getParameter("agent_id"));
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // FILTERING BY ACTIVITY (trip)
            if (R.isSet("from_act")) {
                whereCondition.append("t.from_activity LIKE ? AND ");
                valuesForConditions.add("%"+request.getParameter("from_act")+"%");
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }
            if (R.isSet("to_act")) {
                whereCondition.append("t.to_activity LIKE ? AND ");
                valuesForConditions.add("%"+request.getParameter("to_act")+"%");
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // FILTERING BY TRANSPORT TYPE (leg)
            if (R.isSet("trans_type")) {
                whereCondition.append("l.type = ? AND ");
                valuesForConditions.add(request.getParameter("trans_type"));
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // FILTERING BY AGENT INFO (agent)
            // information in: age, age_val, gender, education, maritalStatus, economicalActivity, driveLicence, ptCard
            // in table:
        /*  
            age integer,
            gender character varying,
            education character varying,
            marital_status character varying,
            economic_activity character varying,
            drivers_licence boolean,
            pt_discount_card boolean
        */
            // age
            if (R.isSet("age") && R.isSet("age_val") && R.isInt("age_val")) {
                String comparator = "";
                String comparatorFromClient = request.getParameter("age");
                if (comparatorFromClient.equals("lt")) {
                    comparator = "<";
                } else if (comparatorFromClient.equals("gt")) {
                    comparator = ">";
                } else if (comparatorFromClient.equals("eq")) {
                    comparator = "=";
                } else {
                    // well this shouldn't happen ...
                    comparator = "=";
                }

                whereCondition.append("a.age "+comparator+" ? AND ");
                valuesForConditions.add(request.getParameter("age_val"));
                types.add(helperClass.VarTypes.IntVar);
                needToDelLastChar = true;
            }

            // gender
            if (R.isSet("gender")) {
                whereCondition.append("a.gender = ? AND ");
                valuesForConditions.add(request.getParameter("gender"));
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // education
            if (R.isSet("education")) {
                whereCondition.append("a.education = ? AND ");
                valuesForConditions.add(request.getParameter("education"));
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // marital_status
            if (R.isSet("maritalStatus")) {
                whereCondition.append("a.marital_status = ? AND ");
                valuesForConditions.add(request.getParameter("maritalStatus"));
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // economic_activity
            if (R.isSet("economicalActivity")) {
                whereCondition.append("a.economic_activity = ? AND ");
                valuesForConditions.add(request.getParameter("economicalActivity"));
                types.add(helperClass.VarTypes.StrVar);
                needToDelLastChar = true;
            }

            // drivers_licence
            if (R.isSet("driveLicence")) {
                whereCondition.append("a.drivers_licence = ? AND ");
                valuesForConditions.add(request.getParameter("driveLicence"));
                types.add(helperClass.VarTypes.BooVar);
                needToDelLastChar = true;
            }

            // pt_discount_card
            if (R.isSet("ptCard")) {
                whereCondition.append("a.pt_discount_card = ? AND ");
                valuesForConditions.add(request.getParameter("ptCard"));
                types.add(helperClass.VarTypes.BooVar);
                needToDelLastChar = true;
            }

            if (needToDelLastChar) whereCondition.setLength(whereCondition.length()-5); // | AND | has length 5

            if (debug_output_query) {
                out.print("\n\n|");
                out.print(whereCondition.toString());
                out.print("|\n\n");
            }
            
            PreparedStatement preparedCommonForTrip = conn.prepareStatement("SELECT DISTINCT "
                + "a.*, t.trip_id, t.end_time, t.start_time, t.from_activity, t.to_activity "
                + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE "
                //+ "t.trip_id=?"
                + whereCondition.toString()
            );
            PreparedStatement preparedAllLegs = conn.prepareStatement("SELECT "
                + "t.trip_id, l.end_time as l_end_time, l.start_time as l_start_time, l.type, ST_AsGeoJSON(path) as geojsonPath "
                + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE "
                //+ "t.trip_id=?"
                + whereCondition.toString()
            );
            for (int i = 1; i < valuesForConditions.size()+1; i++) {
                String var = valuesForConditions.get(i-1);
                switch (types.get(i-1)) {
                    case IntVar:
                        preparedCommonForTrip.setInt(i, Integer.parseInt( var ));
                        preparedAllLegs.setInt(i, Integer.parseInt( var ));
                        break;
                    case BooVar:
                        if (var.equals("T")) {
                            preparedCommonForTrip.setBoolean(i, true);
                            preparedAllLegs.setBoolean(i, true);
                        } else {
                            preparedCommonForTrip.setBoolean(i, false);
                            preparedAllLegs.setBoolean(i, false);
                        }
                        break;
                    default: //default is string
                        preparedCommonForTrip.setString(i, var);
                        preparedAllLegs.setString(i, var);
                        break;
                }
            }

            if (debug_output_query) {
                String tmp_common = preparedCommonForTrip.toString();
                String tmp_legs = preparedAllLegs.toString();
                out.print(tmp_common);
                out.print("\n\n");
                out.print(tmp_legs);

                out.print("\n\n");

                String[] splitTmp = tmp_common.split("WHERE");
                out.print("... WHERE"+splitTmp[1]);
                out.print("\n\n");
            }

            
            //####### SEND QUERIES #######
            
            ResultSet result_common = preparedCommonForTrip.executeQuery();
            ResultSet result_for_all_legs = preparedAllLegs.executeQuery();
            
            ResultSetMetaData rsmd_common = result_common.getMetaData();
            ResultSetMetaData rsmd_all_legs = result_for_all_legs.getMetaData();
            
            int columns_common = rsmd_common.getColumnCount();
            int columns_all_legs = rsmd_all_legs.getColumnCount();
            
            
            HashMap<String, HashMap> TripIDToTripObject = new HashMap<String, HashMap>();
            // add trips to structure
            while (result_common.next()) {
                HashMap trip = new HashMap();
                
                for (int col = 0; col < columns_common; col++) {
                    String attribute = rsmd_common.getColumnName(col + 1);
                    String value = result_common.getString(col + 1);
                    trip.put(attribute, value);
                }
                
                trip.put("_legsLoaded", "0");
                HashMap<String, String> holderForLegs = new HashMap<String, String>();
                trip.put("_legs", holderForLegs);
                
                String tripId = (String) trip.get("trip_id");
                TripIDToTripObject.put(tripId, trip);
                Trips.add(trip);
            }
            
            // add legs to these trips
            while (result_for_all_legs.next()) {
                HashMap leg = new HashMap();
                
                System.out.print("columns_all_legs " + columns_all_legs+"\n");
                for (int col = 0; col < columns_all_legs; col++) {
                    System.out.print("col " + col+"\n");
                    String attribute = rsmd_all_legs.getColumnName(col + 1);
                    String value = result_for_all_legs.getString(col + 1);
                    leg.put(attribute, value);
                }
                // get object representing Trip of this Leg
                String tripId = (String) leg.get("trip_id");
                HashMap tripObject = TripIDToTripObject.get(tripId);
                HashMap trip_legsHolder = (HashMap) tripObject.get("_legs");
                
                int numberOfLoadedLegs = Integer.parseInt((String)tripObject.get("_legsLoaded"));
                trip_legsHolder.put("leg"+(numberOfLoadedLegs), leg);
                numberOfLoadedLegs++;
                tripObject.put("_legsLoaded", ""+numberOfLoadedLegs);
            }
            
        } catch (SQLException es) {
            JSONObject errorJson = new JSONObject();
            errorJson.put("error", "Error while creating connection");
            errorJson.put("errorMessage", es.getMessage());
            error = true;
            out.print(errorJson);
            out.flush();  
        }
    }
    
    if (!error) {
        JSONObject json = new JSONObject();
        for (int i = 0; i < Trips.size(); i++) {
            HashMap h = Trips.get(i);
            /*
            HashMap<String, String> bar = new HashMap<String, String>();
            bar.put("ekmek", "!!");
            HashMap<String, HashMap<String,String>> foo = new HashMap<String, HashMap<String,String>>();
            //foo.put("ekmek", "!!");
            foo.put("leg1", bar);
            h.put("legs", foo);
            */
            String indexById = (String) h.get("trip_id");
            json.put(indexById, h);
            
            
        }
        out.print(json);
        out.flush();        
    }
%>