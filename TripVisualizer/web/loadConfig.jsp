<%@page import="java.util.ArrayList"%>
<%@page import="java.util.HashMap"%>
<%@page import="org.json.simple.JSONObject"%>
<%@page import="tripVisualizerPkg.connection"%>
<%@page import="java.sql.*"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%
    String cityName = request.getParameter("cityName");
    if (cityName == null) {
        cityName = "only_brno_extracted";
    }
    //out.println("cityName = "+cityName);
    HashMap<String, String> configData = new HashMap<String, String>();
    ArrayList<String> outputList = new ArrayList<String>();
    ArrayList<String> tableNamesList = new ArrayList<String>();
    
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
        //SELECT min_time, max_time, map_center_x, map_center_y, grid_step_x, grid_step_y, grid_repetition_x, grid_repetition_y FROM public.config WHERE table_name='only_brno_extracted'
        PreparedStatement prepQuery = conn.prepareStatement("SELECT min_time, max_time, map_center_x, map_center_y, grid_step_x, grid_step_y, grid_repetition_x, grid_repetition_y, grid_on_start FROM public.config WHERE table_name=?");
        prepQuery.setString(1, cityName);
        ResultSet rs = prepQuery.executeQuery();

        ResultSetMetaData rsmd = rs.getMetaData();
        int columns = rsmd.getColumnCount();
        rs.next(); // only 1 row is targeted
        for (int col = 0; col < columns; col++) {
            String attribute = rsmd.getColumnName(col + 1);
            String value = rs.getString(col + 1);
            configData.put(attribute, value);
        }
        
        Statement st = conn.createStatement();
        ResultSet rs_out = st.executeQuery("SELECT output_string, table_name FROM public.config ORDER BY output_string;");
        while (rs_out.next()) {
            outputList.add(rs_out.getString(1));
            tableNamesList.add(rs_out.getString(2));
        }
        conn.close();
    } catch (SQLException es) {
        es.printStackTrace();
    }
    
    JSONObject json = new JSONObject();
    json.putAll(configData);
    json.put("cityNames", outputList);
    json.put("tableNames", tableNamesList);
    out.print(json);
%>

