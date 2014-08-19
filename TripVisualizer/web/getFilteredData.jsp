<%/*
    File representing server side of this project. Is called by AJAX with filtration criteria in POST. 
    Uses this data to create query to PostgreSQL + PostGIS database and finally formates its output in JSON data object.
*/%>
<%@page import="java.util.Arrays"%>
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
    /*
        Establishing connection and required data
    */
    boolean error = false;
    boolean debug_output_request = false; // does interfere with client-server interaction
    boolean debug_output_query = true; // can be running with correct client-server interaction
    
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
    
    // [additionalConditioning] will be added to all queries after WHERE ... <here>
    StringBuilder additionalConditioning = new StringBuilder();
    //additionalConditioning.append("l.type <> 'TELEPORT'");
    // next addition MUST contain ' AND ...' \\
    
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
    int[] stats = new int[3]; // stats - agents, trips, legs

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
            boolean intersectionGeomAdded = false;
            ArrayList<String> valuesForConditions = new ArrayList<String>();
            Boolean addedAtLeastOneCondition = false;

            // load permited values for table name (determined by selected city) from config
            String tableName = request.getParameter("source");
            
            Statement st_permit = conn.createStatement();
            ResultSet rs_permit = st_permit.executeQuery("SELECT table_name FROM public.config;");
            ArrayList<String> permitedTableNames = new ArrayList<String>();
            while (rs_permit.next()) {
                permitedTableNames.add( rs_permit.getString(1) );
            }
            if (!permitedTableNames.contains(tableName)) {
                System.out.print("ILLEGAL TABLE VALUE!!! "+tableName);
                tableName = permitedTableNames.get(0);
                System.out.println(" == set to ==> "+tableName);
            }
            /*System.out.println("permited:");
            for (int i = 0; i < permitedTableNames.size(); i++) {
                System.out.println(""+permitedTableNames.get(i));
            }*/
            
            // FILTERING BY ACTIVITY (trip)
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "from_act[]", "t.from_activity", true, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "to_act[]", "t.to_activity", true, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            
            // FILTERING BY TRANSPORT TYPE (leg)
            addedAtLeastOneCondition = helperClass.MultiselectMacro(R, "trans_type[]", "l.type", false, whereCondition,valuesForConditions, types) || addedAtLeastOneCondition;
            
            // FILTERING BY AGENT INFO (agent)
            // information in: age_from,age_to=age, gender=gender, education=education, maritalStatus=marital_status, economicalActivity=economic_activity, driveLicence=drivers_licence, ptCard=pt_discount_card
            // (<value in request>=<value in table>)
            // age
            if (( R.isSet("age_from") && R.isInt("age_from") ) || ( R.isSet("age_to") && R.isInt("age_to") ) ) {
                if (R.isSet("age_from")) {
                    // age > age_from
                    whereCondition.append("a.age >= ? AND ");
                    valuesForConditions.add(request.getParameter("age_from"));
                    types.add(helperClass.VarTypes.IntVar);
                }
                if (R.isSet("age_to")) {
                    // age < age_to
                    whereCondition.append("a.age <= ? AND ");
                    valuesForConditions.add(request.getParameter("age_to"));
                    types.add(helperClass.VarTypes.IntVar);
                }
                
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
                intersectionGeom.append("SELECT ST_Union(ARRAY[ ");
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
                intersectionGeom.append("])");
                
                if (debug_output_request) out.print("Intersection geometry SQL:\n"+intersectionGeom.toString());
                if (debug_output_query) System.out.print("Intersection geometry SQL:\n"+intersectionGeom.toString());
            
                // add to WHERE condition
                // WHERE ... ST_Intersects(l.path, <intersectionGeom>)
                
                //whereCondition.append("ST_Intersects(l.path, ").append(intersectionGeom).append(") AND ");
                whereCondition.append("ST_Intersects(l.path, (SELECT Geo FROM RectangleSelection) ) AND "); // using 'variable' stored in 'RectangleSelection'
                addedAtLeastOneCondition = true;
                intersectionGeomAdded = true;
            } else if ( R.isInt("boundaries_numOfBoxes") && Integer.parseInt(request.getParameter("boundaries_numOfBoxes")) == 0 ) {
                intersectionGeom.append("SELECT ST_GeomFromText('GEOMETRYCOLLECTION EMPTY')");
                whereCondition.append("ST_Intersects(l.path, (SELECT Geo FROM RectangleSelection) ) AND ");
                addedAtLeastOneCondition = true;
                intersectionGeomAdded = true;
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
            
            /*
                Assembles the final query and sends it to database.
            */
            if (isExploratory) {
                // only exploring how many agents/trips/legs will be affected
                //out.println(whereCondition.toString());
                String whereString = "";
                if (addedAtLeastOneCondition) {
                    whereString = "WHERE "+whereCondition.toString();
                    if (additionalConditioning.length() > 0) {
                        whereString += " AND " + additionalConditioning.toString();
                    }
                } else if (additionalConditioning.length() > 0) {
                    whereString += "WHERE " + additionalConditioning.toString();
                }
                String intersectionDeclarationString = "";
                if (intersectionGeomAdded) {
                        intersectionDeclarationString = "WITH RectangleSelection as ( " + intersectionGeom.toString() + " as Geo) ";
                }
                
                PreparedStatement preparedAgregation = conn.prepareStatement(
                          intersectionDeclarationString
                        + "SELECT "
                        + "count(DISTINCT A.agent_id), count(DISTINCT A.trip_id), count(A.trip_id) "
                        + "FROM ( "
                        + "SELECT a.agent_id, t.trip_id "
                        + "FROM ("+tableName+".agents as a JOIN "+tableName+".trips as t ON a.agent_id = t.agent_id) JOIN "+tableName+".legs as l ON t.trip_id = l.trip_id "
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
                
                /*
                    Handle database response. Simplified query - only exploratory (only fetching number of affected agents, trips, legs).
                */
                JSONObject json = new JSONObject();
                json.put("agents", res.getString(1));
                json.put("trips", res.getString(2));
                json.put("legs", res.getString(3));
                out.print(json);
                out.flush();
            } else {
                PreparedStatement preparedMainQuery;
                PreparedStatement preparedCommonForTrip;
                PreparedStatement preparedAllLegs;
                if (!addedAtLeastOneCondition) {
                    String specialWhereClause = "";
                    if (additionalConditioning.length() > 0) {
                        specialWhereClause += " WHERE " + additionalConditioning.toString();
                    }
                    // No needs to add conditions...
                    preparedMainQuery = conn.prepareStatement("SELECT "
                        + "a.*, t.trip_id, l.end_time as l_end_time, l.start_time as l_start_time, l.type, ST_AsGeoJSON(ST_Multi(path)) as geojsonPath, t.end_time as t_end_time, t.start_time as t_start_time, t.from_activity, t.to_activity "
                        + "FROM ("+tableName+".agents as a JOIN "+tableName+".trips as t ON a.agent_id = t.agent_id) JOIN "+tableName+".legs as l ON t.trip_id = l.trip_id"
                        + specialWhereClause
                    );
                } else {
                    String intersectionString = "";
                    String intersectionDeclarationString = "";
                    if (intersectionGeomAdded) {
                        intersectionDeclarationString = "WITH RectangleSelection as ( " + intersectionGeom.toString() + " as Geo) ";
                        intersectionString = ", CASE "
                        + "WHEN ST_CoveredBy(l.path, (SELECT Geo FROM RectangleSelection)) "
                        +    "THEN ST_AsGeoJSON(ST_Multi(l.path)) "
                        +    "ELSE "
                        +      "ST_AsGeoJSON(ST_Multi( "
                        +        "ST_Intersection(l.path, (SELECT Geo FROM RectangleSelection)) "
                        +      " )) END AS geojsonPath ";
                    } else {
                        intersectionString = ", ST_AsGeoJSON(ST_Multi( l.path )) AS geojsonPath ";
                    }
                    
                    String whereString = "";
                    whereString = "WHERE "+whereCondition.toString();
                    if (additionalConditioning.length() > 0) {
                        whereString += " AND " + additionalConditioning.toString();
                    }
                    
                    preparedMainQuery = conn.prepareStatement(
                          intersectionDeclarationString
                        + "SELECT "
                        + "a.*, t.trip_id, l.end_time as l_end_time, l.start_time as l_start_time, l.type, t.end_time as t_end_time, t.start_time as t_start_time, t.from_activity, t.to_activity "
                        + intersectionString
                        + "FROM ("+tableName+".agents as a JOIN "+tableName+".trips as t ON a.agent_id = t.agent_id) JOIN "+tableName+".legs as l ON t.trip_id = l.trip_id "
                        + whereString
                    );
                    
                    for (int i = 1; i < valuesForConditions.size()+1; i++) {
                        String var = valuesForConditions.get(i-1);
                        switch (types.get(i-1)) {
                            case DblVar:
                                preparedMainQuery.setDouble(i, Double.parseDouble( var ));
                                break;
                            case IntVar:
                                preparedMainQuery.setInt(i, Integer.parseInt( var ));
                                break;
                            case BooVar:
                                if (var.equals("T")) {
                                    preparedMainQuery.setBoolean(i, true);
                                } else {
                                    preparedMainQuery.setBoolean(i, false);
                                }
                                break;
                            default: //default is string
                                preparedMainQuery.setString(i, var);
                                break;
                        }
                    }
                }

                if (debug_output_query) {
                    String tmp_query = preparedMainQuery.toString();
                    System.out.print(tmp_query);
                    System.out.print("\n\n");

                    if (addedAtLeastOneCondition) {
                        String[] splitTmp = tmp_query.split("WHERE");
                        System.out.print("... WHERE"+splitTmp[1]);
                        System.out.print("\n\n");

                        if (debug_output_request) {
                            out.println("... WHERE"+splitTmp[1]);
                        }
                    }
                }

                //out.println("---MAIN QUERY-->");
                //out.println(preparedMainQuery.toString());
                //out.println("----------------");

                //####### SEND QUERIES #######

                ResultSet result_common = preparedMainQuery.executeQuery();
                
                ResultSetMetaData rsmd_common = result_common.getMetaData();

                int columns_common = rsmd_common.getColumnCount();

                HashMap<String, HashMap> TripIDToTripObject = new HashMap<String, HashMap>();
                // add trips to structure
                int rows = 0;
                int distinct_trips = 0;
                ArrayList<String> distinct_agent_ids = new ArrayList<String>();
                
                /*
                    Handle database response.
                */
                
                while (result_common.next()) {
                    rows++;
                    HashMap<String, String> row = new HashMap();

                    for (int col = 0; col < columns_common; col++) {
                        String attribute = rsmd_common.getColumnName(col + 1);
                        String value = result_common.getString(col + 1);
                        row.put(attribute, value);
                    }
                    String tripId = (String) row.get("trip_id");
                    String agentId = (String) row.get("agent_id");
                    
                    String[] legsAttributes = {"trip_id", "l_end_time", "l_start_time", "type", "geojsonpath"};
                    if (!distinct_agent_ids.contains(agentId)) {
                        distinct_agent_ids.add(agentId);
                    }
                    
                    if (!TripIDToTripObject.containsKey(tripId)) {
                        // This is a new leg (aka first leg of new trip)
                        distinct_trips++;
                        
                        HashMap trip = new HashMap();
                        // to leg add only>
                        //l.type, ST_AsGeoJSON(path) as geojsonPath
                        List legsAttributesList = Arrays.asList(legsAttributes);
                        for (String key : row.keySet()) {
                            if (!legsAttributesList.contains(key)) {
                                String value = row.get(key);
                                trip.put(key, value);
                            }
                        }
                        
                        // new one, create new record
                        trip.put("trip_id", tripId);
                        trip.put("_legsLoaded", "0");
                        HashMap<String, String> holderForLegs = new HashMap<String, String>();
                        trip.put("_legs", holderForLegs);

                        TripIDToTripObject.put(tripId, trip);
                        Trips.add(trip);
                    }
                    
                    // add as a leg to already existing one
                    HashMap tripObject = TripIDToTripObject.get(tripId);
                    HashMap trip_legsHolder = (HashMap) tripObject.get("_legs");

                    HashMap leg = new HashMap();
                    // to leg add only>
                    //l.type, ST_AsGeoJSON(path) as geojsonPath
                    for (int i = 0; i < legsAttributes.length; i++) {
                        String attribute = legsAttributes[i];
                        String value = row.get(attribute);
                        leg.put(attribute, value);
                    }

                    int numberOfLoadedLegs = Integer.parseInt((String)tripObject.get("_legsLoaded"));
                    trip_legsHolder.put("leg"+(numberOfLoadedLegs), leg);
                    numberOfLoadedLegs++;
                    tripObject.put("_legsLoaded", ""+numberOfLoadedLegs);
                    
                }
                
                // stats - agents, trips, legs
                stats[0] = distinct_agent_ids.size();
                stats[1] = distinct_trips;
                stats[2] = rows;
            }
            
            // close connections
            conn.close();
        } catch (SQLException es) {
            JSONObject errorJson = new JSONObject();
            errorJson.put("error", "Error while creating connection");
            errorJson.put("errorMessage", es.getMessage());
            error = true;
            out.print(errorJson);
            out.flush();  
        }
    }
    /*
        Adding statistic relevant data.
    */
    if (!error && !isExploratory) {
        
        JSONObject json = new JSONObject();
        // add trips
        for (int i = 0; i < Trips.size(); i++) {
            HashMap h = Trips.get(i);
            String indexById = (String) h.get("trip_id");
            json.put(indexById, h);
        }
        // add statistics
        json.put("agents", stats[0]);
        json.put("trips", stats[1]);
        json.put("legs", stats[2]);
        
        out.print(json);
        out.flush();
    }
%>