<%@page import="java.util.HashMap"%>
<%@page import="tripVisualizerPkg.connection"%>
<%@page import="tripVisualizerPkg.helperClass"%>
<%@page import="java.sql.*"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<pre>
<%
    /*
        Establish connection
    */
    String OUTPUT_STR = "";

    try {
        Class.forName("org.postgresql.Driver");
    } catch (ClassNotFoundException e) {
        e.printStackTrace();
    }

    try {
        String URL = connection.URL;
        String USER = connection.USER;
        String PASS = connection.PASS;
        Connection conn = DriverManager.getConnection(URL, USER, PASS);
        Statement st = conn.createStatement();

        int trip_id = 1;
        //ResultSet rs = st.executeQuery("SELECT * FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE t.trip_id='"+trip_id+"'");
        ResultSet rs = st.executeQuery("SELECT * FROM public.config;");
        
        ResultSetMetaData rsmd = rs.getMetaData();
        int columns = rsmd.getColumnCount();
        int rows = 0;
        HashMap<String, HashMap> Data = new HashMap<String, HashMap>();
        
        while (rs.next()) {
            /*
                For each row:
            */
            rows++;
            HashMap<String, String> row = new HashMap();
            // Load into some sensible dataholder (HashMap in this case)
            for (int col = 0; col < columns; col++) {
                String attribute = rsmd.getColumnName(col + 1);
                String value = rs.getString(col + 1);
                row.put(attribute, value);
                
                OUTPUT_STR += attribute + "=" + value+" | ";
            }
            OUTPUT_STR += "<br>";
            //-----------------------------------\\
            // LOADED VALUES: table_name, output_string, min_time, max_time, map_center_x, map_center_y, grid_step_x, grid_step_y, grid_repetition_x, grid_repetition_y
            // we need only "table_name", the rest will be counted...
            // 
            //-----------------------------------//
            
            HashMap<String, String> CHANGE = new HashMap();
            
            String tableName = row.get("table_name");
            String outputString = row.get("output_string");
            
            /* <]---<output_string>---[> */
            if (outputString == null) {
                // convert for example "only_brno_extracted" -> "Only Brno Extracted"
                String[] tokens = tableName.split("_");
                String generatedOutputStr = "";
                for(int i = 0; i < tokens.length; i++){
                    char capLetter = Character.toUpperCase(tokens[i].charAt(0));
                    generatedOutputStr +=  " " + capLetter + tokens[i].substring(1, tokens[i].length());
                }
                generatedOutputStr = generatedOutputStr.trim();
                
                //String queryToPerform = "UPDATE public.config SET output_string='"+generatedOutputStr+"' WHERE table_name='"+tableName+"';";
                CHANGE.put("output_string", generatedOutputStr);
                out.println("output_string => "+generatedOutputStr);
            }
            
            /* <]---<min_time>---[> + <]---<max_time>---[> */
            // SELECT min(start_time) as min, max(end_time) as max FROM <only_brno_extracted>.trips;
            Statement st_minMax = conn.createStatement();
            ResultSet rs_minMax = st_minMax.executeQuery("SELECT min(start_time) as min, max(end_time) as max FROM "+tableName+".trips;");
            rs_minMax.next();
            long min = Long.parseLong( rs_minMax.getString("min") );
            long max = Long.parseLong( rs_minMax.getString("max") );
            
            //String queryToPerform = "UPDATE public.config SET min_time='"+min+"', max_time='"+max+"' WHERE table_name='"+tableName+"';";
            CHANGE.put("min_time", min+"");
            CHANGE.put("max_time", max+"");
            out.println("min_time => "+min);
            out.println("max_time => "+max);
            
            // Perform changes:
            StringBuilder changes = new StringBuilder();
            for (String attr : CHANGE.keySet()) {
                String val = CHANGE.get(attr);
                //|<attr>='<val>', |
                changes.append(attr+"='"+val+"', ");
            }
            changes.setLength(changes.length()-2); // remove last |, |
            
            String queryToPerform = "UPDATE public.config SET "+changes.toString()+" WHERE table_name='"+tableName+"';";
            out.println("\n"+queryToPerform+"\n");
            helperClass.executeQuery(conn, queryToPerform);
            
            /* <]---<GRID SETTINGS>---[> */
            //map_center_x, map_center_y, grid_step_x, grid_step_y, grid_repetition_x, grid_repetition_y
/*
            Statement st_grid = conn.createStatement();
            ResultSet rs_grid = st_grid.executeQuery("SELECT "
                +"ST_X((foo).geom), ST_Y((foo).geom) "
                +"FROM ("
                        +"SELECT ST_DumpPoints(ST_Envelope(ST_Multi(ST_Union(path)))) as foo "
                        +"FROM ("+tableName+".agents as a JOIN "+tableName+".trips as t ON a.agent_id = t.agent_id) JOIN "+tableName+".legs as l ON t.trip_id = l.trip_id"
                +") as foo;");
            
            rs_grid.next();
            String a_x = rs_grid.getString(1);
            String a_y = rs_grid.getString(2);
            rs_grid.next();
            String b_x = rs_grid.getString(1);
            String b_y = rs_grid.getString(2);
            rs_grid.next();
            String c_x = rs_grid.getString(1);
            String c_y = rs_grid.getString(2);
            rs_grid.next();
            String d_x = rs_grid.getString(1);
            String d_y = rs_grid.getString(2);
*/
            /*MANUAL HAX*/
String a_x="16.558416999999999"; String a_y="49.165300999999999";
String b_x="16.558416999999999"; String b_y="49.245753999999998";
String c_x="16.669551999999999"; String c_y="49.245753999999998";
String d_x="16.669551999999999"; String d_y="49.165300999999999";
            out.println(a_x+" "+a_y);
            out.println(b_x+" "+b_y);
            out.println(c_x+" "+c_y);
            out.println(d_x+" "+d_y);
            
            // {"type":"Polygon","coordinates":[[[16.558417,49.165301],[16.558417,49.245754],[16.669552,49.245754],[16.669552,49.165301],[16.558417,49.165301]]]}
            //String gridConvex = "{\"type\":\"Polygon\",\"coordinates\":[[[16.558417,49.165301],[16.558417,49.245754],[16.669552,49.245754],[16.669552,49.165301],[16.558417,49.165301]]]}";
            
            //out.println("gridConvex:");
            //out.println(gridConvex);
        }
        
        out.print("<br>"+OUTPUT_STR);

        conn.close();
    } catch (SQLException es) {
        out.print("Connection error; E:\n"+es.getMessage());
        es.printStackTrace();
    }
%>
</pre>