<%@page import="tripVisualizerPkg.connection"%>
<%@page import="java.io.IOException"%>
<%@page import="tripVisualizerPkg.helperClass.VarTypes"%>
<%@page import="java.util.List"%>
<%@page import="java.util.ArrayList"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.HashMap"%>
<%@page import="tripVisualizerPkg.helperClass"%>
<%@page contentType="text/html; charset=UTF-8"%>
<%@page import="java.sql.*"%>
<%@page import="org.json.simple.JSONObject"%>
<%
    boolean error = false;
    boolean debug_output_request = false; // does interfere with client-server interaction
    boolean debug_output_query = true; // can be running with correct client-server interaction
    boolean timer = true;
    
    if (debug_output_request || debug_output_query) {
        JSONObject tmpJson = new JSONObject();

        Map<String, String[]> parameters = request.getParameterMap();
        for (String parameter : parameters.keySet()) {
            String val = request.getParameter(parameter);
            tmpJson.put(parameter, val);
        }
        
        if (debug_output_request) {
            out.println(tmpJson);
            out.flush();
        }
        if (debug_output_query) {
            System.out.print("\n|");
            System.out.print(tmpJson.toString());
            System.out.print("|\n");
        }
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
    Boolean isExploratory = Boolean.parseBoolean(request.getParameter("isExploratory"));
    
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
            StringBuilder intersectionGeom = new StringBuilder();
            ArrayList<String> valuesForConditions = new ArrayList<String>();
            Boolean addedAtLeastOneCondition = false;

            // FILTERING BY ID 
            /*
            // trip_id and agent_id wont be used ...
            if (R.isSet("trip_id") && R.isInt("trip_id")) {
                whereCondition.append("t.trip_id = ? AND ");
                valuesForConditions.add(request.getParameter("trip_id"));
                types.add(helperClass.VarTypes.IntVar);
                addedAtLeastOneCondition = true;
            }

            if (R.isSet("agent_id")) {
                whereCondition.append("a.agent_id = ? AND ");
                valuesForConditions.add(request.getParameter("agent_id"));
                types.add(helperClass.VarTypes.StrVar);
                addedAtLeastOneCondition = true;
            }
            */

            // FILTERING BY ACTIVITY (trip)
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "from_act[]", "t.from_activity", true, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "to_act[]", "t.to_activity", true, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            
            // FILTERING BY TRANSPORT TYPE (leg)
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "trans_type[]", "l.type", false, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            
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
                addedAtLeastOneCondition = true;
            }

            // gender
            if (R.isSet("gender")) {
                whereCondition.append("a.gender = ? AND ");
                
                String genderStr = request.getParameter("gender");
                if (genderStr.equals("M")) {
                    valuesForConditions.add("MALE");
                } else if (genderStr.equals("F")) {
                    valuesForConditions.add("FEMALE");
                } else {
                    // well this shouldn't happen ...
                    valuesForConditions.add("FEMALE");
                }
                
                types.add(helperClass.VarTypes.StrVar);
                addedAtLeastOneCondition = true;
            }

            // education
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "education[]", "a.education", false, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            
            // marital_status
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "maritalStatus[]", "a.marital_status", false, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;

            // economic_activity
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "economicalActivity[]", "a.economic_activity", false, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;


            // drivers_licence
            if (R.isSet("driveLicence")) {
                whereCondition.append("a.drivers_licence = ? AND ");
                valuesForConditions.add(request.getParameter("driveLicence"));
                types.add(helperClass.VarTypes.BooVar);
                addedAtLeastOneCondition = true;
            }

            // pt_discount_card
            if (R.isSet("ptCard")) {
                whereCondition.append("a.pt_discount_card = ? AND ");
                valuesForConditions.add(request.getParameter("ptCard"));
                types.add(helperClass.VarTypes.BooVar);
                addedAtLeastOneCondition = true;
            }
            
            // FILTERING BY MULTIPOLYGON SELECTION !
            if (R.isSet("boundaries_numOfBoxes") && R.isInt("boundaries_numOfBoxes") && Integer.parseInt(request.getParameter("boundaries_numOfBoxes")) > 0) {
                int numOfBoxes = Integer.parseInt(request.getParameter("boundaries_numOfBoxes"));
                // LOAD BOUNDARY
                double[][][] boundaries = helperClass.parseArrDouble(request,"boundaries",numOfBoxes,5);
                if (debug_output_query || debug_output_request) {
                    for (int i=0; i<boundaries.length; i++) {
                        for (int j=0; j<boundaries[0].length; j++) {
                            System.out.print(boundaries[i][j][0]+" "+boundaries[i][j][1]+", ");
                            if (debug_output_request) out.print(boundaries[i][j][0]+" "+boundaries[i][j][1]+", ");
                        }
                        System.out.println("");
                        if (debug_output_request) out.println("");
                    }
                }
                

                // Structure of "boundaries"
                // [
                //  [[[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy],[Ax,Ay]]], <- one box
                //  [[[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy],[Ax,Ay]]], <- second box
                //  ...                                          <- etc...
                // ]
                
                // BUILD GEOMETRY (union of polygons!)
                /*
                    ST_Union(
                            ST_GeomFromText('POLYGON((
                            <POINTS OF BOX>     <-- Ax Ay, Bx By, Cx Cy, Dx Dy, Ax Ay
                            ))', 4326),
                            <... etc>
                    )
                */
                intersectionGeom.append("(SELECT ST_Union(ARRAY[ ");
                for (int i=0; i<numOfBoxes; i++) {
                    intersectionGeom.append("ST_GeomFromText('POLYGON((");
                    for (int j=0; j<boundaries[i].length; j++) {
                        intersectionGeom.append(boundaries[i][j][0]+" "+boundaries[i][j][1]+", ");
                    }
                    intersectionGeom.setLength(intersectionGeom.length()-2);
                    intersectionGeom.append("))', 4326),");
                }
                // delete last ","
                intersectionGeom.setLength(intersectionGeom.length()-1);
                intersectionGeom.append("]) )");
                
                if (debug_output_request) out.print("Intersection geometry SQL:\n"+intersectionGeom.toString());
                if (debug_output_query) System.out.print("Intersection geometry SQL:\n"+intersectionGeom.toString());
            
                // add to WHERE condition
                // WHERE ... ST_Intersects(l.path, <intersectionGeom>)
                
                whereCondition.append("ST_Intersects(l.path, ").append(intersectionGeom).append(") AND ");
                addedAtLeastOneCondition = true;
            }
            
            
            
            // FILTERING BY RECTANGULAR SELECTION
            // in request: bound_a_lon, bound_a_lat, bound_b_lon, bound_b_lat
            // http://postgis.org/docs/ST_Intersects.html
            // - ST_MakeEnvelope(minLon, minLat, maxLon, maxLat, 4326)
            if (R.isSet("bound_a_lon") && R.isSet("bound_a_lat") && R.isSet("bound_b_lon") && R.isSet("bound_b_lat")) {
                // WRONG WAYS
                // the ones which use bounding box of l.path
                //whereCondition.append("l.path && ST_MakeEnvelope(?, ?, ?, ?, 4326) AND ");
                whereCondition.append("l.path @ ST_MakeEnvelope(?, ?, ?, ?, 4326) AND "); // if paths bounding box is inside selected rectangle
                //whereCondition.append("l.path ~ ST_MakeEnvelope(?, ?, ?, ?, 4326) AND "); // if selected rect is inside of paths bounding box - not what we want
                //whereCondition.append("ST_Contains(ST_MakeEnvelope(?, ?, ?, ?, 4326), l.path) AND ");
                //whereCondition.append("Not ST_IsEmpty(ST_Buffer(ST_Intersection(l.path, ST_MakeEnvelope(?, ?, ?, ?, 4326)),0.0)) AND ");
                
                // precise intersection
                //whereCondition.append("Not ST_IsEmpty(ST_Intersection(l.path, ST_MakeEnvelope(?, ?, ?, ?, 4326))) AND ");
                // \ this works but is kinda slow ...
                
                // CORRECT WAY
                // also proper intersection, but boolean -> ST_Intersects instead of ST_Intersection
                //whereCondition.append("ST_Intersects(l.path, ST_MakeEnvelope(?, ?, ?, ?, 4326)) AND ");
                
                // GENERALY WE WANT
                // whereCondition.append("l.path @ ST_MakeEnvelope(?, ?, ?, ?, 4326) AND "); // if paths bounding box is inside selected rectangle
                // ... but it can't cut legs in halves, so it sometimes looks wierd...
                
                valuesForConditions.add(request.getParameter("bound_a_lon"));
                valuesForConditions.add(request.getParameter("bound_a_lat"));
                valuesForConditions.add(request.getParameter("bound_b_lon"));
                valuesForConditions.add(request.getParameter("bound_b_lat"));
                types.add(helperClass.VarTypes.DblVar);
                types.add(helperClass.VarTypes.DblVar);
                types.add(helperClass.VarTypes.DblVar);
                types.add(helperClass.VarTypes.DblVar);
                addedAtLeastOneCondition = true;
            }
            
            // FILTERING BY TIME
            // in request: time_start, time_end
            // we can connect this either with legs or whole trips - I choose legs variant for now, to have more interesting results
            if (R.isSet("time_start")) {
                whereCondition.append("l.start_time > ? AND ");
                valuesForConditions.add(request.getParameter("time_start"));
                types.add(helperClass.VarTypes.IntVar);
                addedAtLeastOneCondition = true;
            }
            
            if (R.isSet("time_end")) {
                whereCondition.append("l.end_time < ? AND ");
                valuesForConditions.add(request.getParameter("time_end"));
                types.add(helperClass.VarTypes.IntVar);
                addedAtLeastOneCondition = true;
            }

            // --- end of filters ---
            
            if (addedAtLeastOneCondition) whereCondition.setLength(whereCondition.length()-5); // | AND | has length 5

            if (debug_output_query) {
                if (debug_output_request) {
                    out.print("\n\n|");
                    out.println(whereCondition.toString());
                    out.print("|\n\n");
                }
                
                System.out.print("\n\n|");
                System.out.print(whereCondition.toString());
                System.out.print("|\n\n");
            }
            if (isExploratory) {
                // only exploring how many agents/trips/legs will be affected
                //out.println(whereCondition.toString());
                String whereString = "";
                if (addedAtLeastOneCondition) {
                    whereString = "WHERE "+whereCondition.toString();
                }
                
                PreparedStatement preparedAgregation = conn.prepareStatement("SELECT "
                        + "count(DISTINCT A.agent_id), count(DISTINCT A.trip_id), count(A.trip_id) "
                        + "FROM ( "
                        + "SELECT a.agent_id, t.trip_id "
                        + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id "
                        + whereString
                        + ") as A");
                for (int i = 1; i < valuesForConditions.size()+1; i++) {
                    String var = valuesForConditions.get(i-1);
                    switch (types.get(i-1)) {
                        case DblVar:
                            preparedAgregation.setDouble(i, Double.parseDouble( var ));
                            break;
                        case IntVar:
                            preparedAgregation.setInt(i, Integer.parseInt( var ));
                            break;
                        case BooVar:
                            if (var.equals("T")) {
                                preparedAgregation.setBoolean(i, true);
                            } else {
                                preparedAgregation.setBoolean(i, false);
                            }
                            break;
                        default: //default is string
                            preparedAgregation.setString(i, var);
                            break;
                    }
                }
                //out.println(preparedAgregation.toString());
                
                ResultSet res = preparedAgregation.executeQuery();
                res.next();
                
                JSONObject json = new JSONObject();
                json.put("agents", res.getString(1));
                json.put("trips", res.getString(2));
                json.put("legs", res.getString(3));
                out.print(json);
                out.flush();
            } else {
                PreparedStatement preparedCommonForTrip;
                PreparedStatement preparedAllLegs;
                if (!addedAtLeastOneCondition) {
                    // No needs to add conditions...
                    preparedCommonForTrip = conn.prepareStatement("SELECT DISTINCT "
                        + "a.*, t.trip_id, t.end_time, t.start_time, t.from_activity, t.to_activity "
                        + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id"
                    );
                    preparedAllLegs = conn.prepareStatement("SELECT "
                        + "t.trip_id, l.end_time as l_end_time, l.start_time as l_start_time, l.type, ST_AsGeoJSON(path) as geojsonPath "
                        + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id"
                    );
                } else {
                    preparedCommonForTrip = conn.prepareStatement("SELECT DISTINCT "
                        + "a.*, t.trip_id, t.end_time, t.start_time, t.from_activity, t.to_activity "
                        + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE "
                        //+ "t.trip_id=?"
                        + whereCondition.toString()
                    );
                    preparedAllLegs = conn.prepareStatement("SELECT "
                        + "t.trip_id, l.end_time as l_end_time, l.start_time as l_start_time, l.type, ST_AsGeoJSON(path) as geojsonPath "
                        + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE "
                        //+ "t.trip_id=?"
                        + whereCondition.toString()
                    );

                    for (int i = 1; i < valuesForConditions.size()+1; i++) {
                        String var = valuesForConditions.get(i-1);
                        switch (types.get(i-1)) {
                            case DblVar:
                                preparedCommonForTrip.setDouble(i, Double.parseDouble( var ));
                                preparedAllLegs.setDouble(i, Double.parseDouble( var ));
                                break;
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
                }

                if (debug_output_query) {
                    String tmp_common = preparedCommonForTrip.toString();
                    String tmp_legs = preparedAllLegs.toString();
                    System.out.print(tmp_common);
                    System.out.print("\n\n");
                    System.out.print(tmp_legs);

                    System.out.print("\n\n");

                    if (addedAtLeastOneCondition) {
                        String[] splitTmp = tmp_common.split("WHERE");
                        System.out.print("... WHERE"+splitTmp[1]);
                        System.out.print("\n\n");

                        if (debug_output_request) {
                            out.println("... WHERE"+splitTmp[1]);
                        }
                    }
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

                    for (int col = 0; col < columns_all_legs; col++) {
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
    
    if (!error && !isExploratory) {
        
        JSONObject json = new JSONObject();
        for (int i = 0; i < Trips.size(); i++) {
            HashMap h = Trips.get(i);
            String indexById = (String) h.get("trip_id");
            json.put(indexById, h);
            
        }
        out.print(json);
        out.flush();        
    }
%>