<%@page import="java.util.List"%>
<%@page import="java.util.ArrayList"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.HashMap"%>
<%@page import="tripVisualizerPkg.connection"%>
<%@page contentType="text/html; charset=UTF-8"%>
<%@page import="java.sql.*"%>
<%@page import="org.json.simple.JSONObject"%>
<%
    // PREPARE STRUCTURE
    List<HashMap<String, String>> Trip = new ArrayList<HashMap<String, String>>();

    boolean error = false;
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
            // CREATE CONNECTION
            String URL = connection.URL;
            String USER = connection.USER;
            String PASS = connection.PASS;
            Connection conn = DriverManager.getConnection(URL, USER, PASS);
            Statement st = conn.createStatement();

            // BUILD QUERY
            int trip_id = 1;
            if (request.getParameter("trip_id") != null) {
                trip_id = Integer.parseInt(request.getParameter("trip_id"));
            }
            
            PreparedStatement prep = conn.prepareStatement("SELECT "
                    + "a.*, t.trip_id, t.end_time, t.start_time, t.from_activity, t.to_activity, l.end_time as l_end_time, l.start_time as l_start_time, l.type, ST_AsGeoJSON(path) as geojsonPath "
                    + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE "
                    + "t.trip_id=?"
            );//"SELECT *, ST_AsGeoJSON(path) as geojsonPath FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE t.trip_id=?"
            prep.setInt(1, trip_id);
            ResultSet rs = prep.executeQuery();
            
            // PROCESS QUERY
            ResultSetMetaData rsmd = rs.getMetaData();
            int columns = rsmd.getColumnCount();
            int row = 1;
            while (rs.next()) {
                // PROCESS ROW
                HashMap leg = new HashMap();
                
                for (int col = 0; col < columns; col++) {
                    String attribute = rsmd.getColumnName(col + 1);
                    String value = rs.getString(col + 1);
                    leg.put(attribute, value);
                }
                
                Trip.add(leg);
                row++;
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
        for (int i = 0; i < Trip.size(); i++) {
            HashMap h = Trip.get(i);
            json.put("leg" + i, h);
        }
        out.print(json);
        out.flush();        
    }
%>