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
// <HAX>
try {
// </HAX>
    JSONObject tmpJson = new JSONObject();
    
    Map<String, String[]> parameters = request.getParameterMap();
    for (String parameter : parameters.keySet()) {
        String val = request.getParameter(parameter);
        tmpJson.put(parameter, val);
    }
    out.print(tmpJson);
    out.flush();

    out.print("\n\nQuery:");

    // PREPARE STRUCTURE
    List<HashMap<String, String>> Trip = new ArrayList<HashMap<String, String>>();

    try {
        Class.forName("org.postgresql.Driver");
    } catch (ClassNotFoundException e) {
        JSONObject errorJson = new JSONObject();
        errorJson.put("error", "Error while searching class for org.postgresql.Driver");
        errorJson.put("errorMessage", e.getMessage());
        out.print(errorJson);
        out.flush();
    }

    // CREATE CONNECTION
    String URL = connection.URL;
    String USER = connection.USER;
    String PASS = connection.PASS;
    Connection conn = DriverManager.getConnection(URL, USER, PASS);

    helperClass.requestHandler R = new helperClass.requestHandler(request);

    // BUILD QUERY
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
        //whereCondition.append("t.from_activity LIKE %?% AND ");
        //valuesForConditions.add(request.getParameter("trans_type"));
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
    
    //t.to_activity LIKE '%WORK%'
    
    // FILTERING BY TRANSPORT TYPE (leg)
    if (R.isSet("trans_type")) {
        whereCondition.append("l.type = ? AND ");
        valuesForConditions.add(request.getParameter("trans_type"));
        types.add(helperClass.VarTypes.StrVar);
        needToDelLastChar = true;
    }
    

    if (needToDelLastChar) whereCondition.setLength(whereCondition.length()-5); // | AND | has length 5
    
    out.print("\n\n|");
    out.print(whereCondition.toString());
    out.print("|\n\n");
    
    PreparedStatement prep = conn.prepareStatement("SELECT "
        + "a.*, t.trip_id, t.end_time, t.start_time, t.from_activity, t.to_activity, l.end_time as l_end_time, l.start_time as l_start_time, l.type, ST_AsGeoJSON(path) as geojsonPath "
        + "FROM (only_brno_extracted.agents as a JOIN only_brno_extracted.trips as t ON a.agent_id = t.agent_id) JOIN only_brno_extracted.legs as l ON t.trip_id = l.trip_id WHERE "
        //+ "t.trip_id=?"
        + whereCondition.toString()
    );
    for (int i = 1; i < valuesForConditions.size()+1; i++) {
        switch (types.get(i-1)) {
            case IntVar:
                prep.setInt(i, Integer.parseInt( valuesForConditions.get(i-1) ));
                break;
            default: //default is string
                prep.setString(i, valuesForConditions.get(i-1));
                break;
        }
    }
    
    
    String tmp = prep.toString();
    out.print(tmp);
    
    out.print("\n\n");
    
    String[] splitTmp = tmp.split("WHERE");
    out.print("... WHERE"+splitTmp[1]);
    
// <HAX>
} catch (Exception e) {
    out.print(e.getMessage());
}
// </HAX>
%>