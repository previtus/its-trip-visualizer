<%@page import="java.util.HashMap"%>
<%@page import="tripVisualizerPkg.connection"%>
<%@page import="tripVisualizerPkg.helperClass"%>
<%@page import="java.sql.*"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
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

        ResultSet rs = st.executeQuery("SELECT * FROM public.config;");
        
%>
<h1>Before</h1>
<%
        out.print( helperClass.tableToOutput(conn, "public.config") );
%>
<h1>Refreshing ...</h1>
<%
        ResultSetMetaData rsmd = rs.getMetaData();
        int columns = rsmd.getColumnCount();
        int rows = 0;
        HashMap<String, HashMap> Data = new HashMap<String, HashMap>();
        out.print("<pre>");
        while (rs.next()) {
            out.println("-------------- ROW "+rows+" --------------");
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
            
            /* <]---<GRID SETTINGS>---[> */
            //map_center_x, map_center_y, grid_step_x, grid_step_y, grid_repetition_x, grid_repetition_y

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

            /*MANUAL HAX*/
/*String a_x="16.558416999999999"; String a_y="49.165300999999999";
String b_x="16.558416999999999"; String b_y="49.245753999999998";
String c_x="16.669551999999999"; String c_y="49.245753999999998";
String d_x="16.669551999999999"; String d_y="49.165300999999999";*/
            out.println("A: "+a_x+" "+a_y);
            out.println("B: "+b_x+" "+b_y);
            out.println("C: "+c_x+" "+c_y);
            out.println("D: "+d_x+" "+d_y);
            
            double[] a = {Double.parseDouble(a_x), Double.parseDouble(a_y)};
            double[] b = {Double.parseDouble(b_x), Double.parseDouble(b_y)};
            double[] c = {Double.parseDouble(c_x), Double.parseDouble(c_y)};
            double[] d = {Double.parseDouble(d_x), Double.parseDouble(d_y)};
            
            // central point
            double[] center = new double[2];
            center[0] = (a[0]+b[0]+c[0]+d[0])/4;
            center[1] = (a[1]+b[1]+c[1]+d[1])/4;
            
            int m = 100000;
            center[0] = ((double)Math.round(center[0]*m))/m;
            center[1] = ((double)Math.round(center[1]*m))/m;
            
            CHANGE.put("map_center_x", center[0]+"");
            CHANGE.put("map_center_y", center[1]+"");
            
            out.println("CENTER: "+center[0]+" "+center[1]);
            
            // predefined values for step_x/y
            double step_x = 0.0108;
            double step_y = 0.03;
            CHANGE.put("grid_step_x", step_x+"");
            CHANGE.put("grid_step_y", step_y+"");

            // counting repetition times == GridSettings.x/y_times
            double distance_x = Math.abs(c[1] - center[1]);
            double distance_y = Math.abs(c[0] - center[0]);
            
            double offset_x = 0;
            double offset_y = 0;
            
            int repetition_x = (int) Math.ceil( (distance_x + offset_x)/step_x );
            int repetition_y = (int) Math.ceil( (distance_y + offset_y)/step_y );
            out.println("REPEAT: "+repetition_x+" "+repetition_y);

            CHANGE.put("grid_repetition_x", repetition_x+"");
            CHANGE.put("grid_repetition_y", repetition_y+"");

            
            // Perform changes:
            StringBuilder changes = new StringBuilder();
            for (String attr : CHANGE.keySet()) {
                String val = CHANGE.get(attr);
                //|<attr>='<val>', |
                changes.append(attr+"='"+val+"', ");
            }
            changes.setLength(changes.length()-2); // remove last |, |
            
            String queryToPerform = "UPDATE public.config SET "+changes.toString()+" WHERE table_name='"+tableName+"';";
            out.println("\n"+queryToPerform);
            boolean boo = helperClass.executeQuery(conn, queryToPerform);
            if (boo) { out.println("OK"); } else { out.println("ERROR"); };
            out.println(" -------------- * --------------");
        }
        out.print("<br>"+OUTPUT_STR);
        out.print("</pre>");
%>
<h1>After</h1>
<%
        out.print( helperClass.tableToOutput(conn, "public.config") );
        
        conn.close();
    } catch (SQLException es) {
        out.print("Connection error; E:\n"+es.getMessage());
        es.printStackTrace();
    }
// restart sql:    
// UPDATE public.config SET map_center_y='0', grid_step_x='0', grid_step_y='0', map_center_x='0', grid_repetition_x='0', max_time='0', grid_repetition_y='0', min_time='0' WHERE table_name='only_brno_extracted';
// UPDATE public.config SET map_center_y='0', grid_step_x='0', grid_step_y='0', map_center_x='0', grid_repetition_x='0', max_time='0', grid_repetition_y='0', min_time='0' WHERE table_name='only_brno_extracted_copy';
%>