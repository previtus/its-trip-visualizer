<%-- 
    Document   : test_postgresql
    Created on : 30.6.2014, 20:53:52
    Author     : Vítek Růžička
--%>

<%@page import="tripVisualizerPkg.connection"%>
<%@page import="java.sql.*"%>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>JSP Page</title>
        <link rel="stylesheet" href="tempStyles.css" />
    </head>
    <body>
        <h1>Hello World!</h1>
        <!-- SELECT * FROM only_brno_extracted.agents WHERE age > 70 -->
        
        <table border="1">
        <%
            out.append("Hello<br>");

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
                //ResultSet rs = st.executeQuery("SELECT * FROM only_brno_extracted.agents WHERE age > 70");
                //ResultSet rs = st.executeQuery("SELECT * FROM only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id WHERE a.agent_id='Citizen0'");
                //String agent_id = "Citizen0";
                //ResultSet rs = st.executeQuery("SELECT * FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE a.agent_id='"+agent_id+"'");
                
                int trip_id = 1;
                //ResultSet rs = st.executeQuery("SELECT * FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE t.trip_id='"+trip_id+"'");
                ResultSet rs = st.executeQuery("SELECT *, ST_AsGeoJSON(path) as geojsonPath FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE t.trip_id='"+trip_id+"'");
                
                ResultSetMetaData rsmd = rs.getMetaData();

                int columns = rsmd.getColumnCount();
                
                // Table headers: Column names
                String parsedStr = "<tr>";
                for (int col = 0; col < columns; col++) {
                    parsedStr += "<th>"+rsmd.getColumnName(col + 1) + "</th>";
                    // getString is counted from 1, not 0
                }
                out.append(parsedStr+"</tr>");
                // Table headers: Column types
                parsedStr = "<tr class='typesRow'>";
                for (int col = 0; col < columns; col++) {
                    parsedStr += "<td>"+rsmd.getColumnTypeName(col + 1) + "</td>";
                    // getString is counted from 1, not 0
                }
                out.append(parsedStr+"</tr>");

                
                int row = 0;
                while (rs.next()) {
                    parsedStr = "<tr>";
                    for (int col = 0; col < columns; col++) {
                        if (rsmd.getColumnName(col + 1).equals("path")) {
                            parsedStr += "<td>[.....]</td>";  
                        } else {
                            parsedStr += "<td>"+rs.getString(col + 1) + "</td>";
                        }
                        // getString is counted from 1, not 0
                    }

                    //System.out.println(parsedStr);
                    out.append(parsedStr + "</tr>");

                    row++;
                }
            } catch (SQLException es) {
                es.printStackTrace();
            }
        %>
        </table>
    </body>
</html>
