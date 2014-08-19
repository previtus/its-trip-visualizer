<%@page import="tripVisualizerPkg.connection"%>
<%@page import="java.sql.*"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
{"type":"Polygon","coordinates":[[[16.558439,49.16538],[16.558439,49.245754],[16.67,49.245754],[16.67,49.16538],[16.558439,49.16538]]]}
<%
    /*
            String JSON_STR = "";
            
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
                ResultSet rs = st.executeQuery("SELECT "
                    + "ST_AsGeoJSON(ST_Envelope(ST_Multi(ST_Union(path)))) as mergedGeoEnvelope "
                    + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id"
                    + "");
                
                ResultSetMetaData rsmd = rs.getMetaData();
                rs.next();
                JSON_STR = rs.getString(1);
                
                out.print(JSON_STR);
                
                conn.close();
            } catch (SQLException es) {
                es.printStackTrace();
            }
       */ %>