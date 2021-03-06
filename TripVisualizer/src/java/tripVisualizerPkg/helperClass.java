package tripVisualizerPkg;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import javax.servlet.http.HttpServletRequest;

public class helperClass {
    public static enum VarTypes {
        StrVar, IntVar, BooVar, DblVar
    }
    
    public static boolean isStringInt(String str) {
        try {
            int d = Integer.parseInt(str);
        } catch (NumberFormatException nfe) {
            return false;
        }
        return true;
    }
    
    public static class requestHandler {
        HttpServletRequest request;
        public requestHandler(HttpServletRequest r) {
            this.request = r;
        }
        
        public boolean isSet(String paramName) {
            return (request.getParameter(paramName) != null);
        }
         
        public boolean isInt(String paramName) {
            return isStringInt( request.getParameter(paramName) );
        }
        
    }
    
    public static boolean MultiselectMacro(requestHandler R, String paramName, String tableName, boolean like, StringBuilder whereCondition, ArrayList<String> valuesForConditions, ArrayList<VarTypes> types) {
            if (R.isSet(paramName)) { // is array!
                String[] var_array=R.request.getParameterValues(paramName);
                String comp = "=";
                if (like) {
                    comp = "LIKE";
                }
                
                whereCondition.append("(");
                for (int i=0; i<var_array.length; i++) {
                    whereCondition.append(tableName).append(" ").append(comp).append(" ? OR ");
                    if (like) {
                        valuesForConditions.add("%"+ var_array[i] +"%");
                    } else {
                        valuesForConditions.add(var_array[i]);
                    }
                    
                    types.add(helperClass.VarTypes.StrVar);
                }
                whereCondition.setLength(whereCondition.length()-3); // delete last "OR "
                whereCondition.append(") AND ");
                return true;
            }
            return false;
    }
    
    public static double[][][] parseArrDouble(HttpServletRequest request, String name, int x, int y) {
        double[][][] Mordor = new double[x][y][2];
    
        for (int i=0; i<x; i++) {
            //boundaries[<i>][<0-3>]
            for (int j=0; j<y; j++) {
                String[] var_array = request.getParameterValues(name+"["+i+"]["+j+"][]");
                
                Mordor[i][j][0] = Double.parseDouble( var_array[0] );
                Mordor[i][j][1] = Double.parseDouble( var_array[1] );
                //Double.parseDouble(request.getParameter(name+"["+i+"]["+j+"][]"));
            }
        }
        return Mordor;
    }
    
    public static boolean executeQuery(Connection conn, String q) {
        System.out.println("<QUERY> "+q);
        try {
            Statement st = conn.createStatement();
            st.executeUpdate(q);
            return true;
        } catch (SQLException ex) {
            System.out.println("Query exection error; E:\n"+ex.getMessage());
            return false;
        }
    }
    
    public static String tableToOutput(Connection conn, String tableName) {
        String OUTPUT_STR = "";
        try {
            Statement st = conn.createStatement();
            ResultSet rs = st.executeQuery("SELECT * FROM " + tableName + ";");

            ResultSetMetaData rsmd = rs.getMetaData();
            int columns = rsmd.getColumnCount();
            OUTPUT_STR += "<table border='1'><tr><th>row</th>";
            for (int col = 0; col < columns; col++) {
                OUTPUT_STR += "<th>" + rsmd.getColumnName(col + 1) + "</th>";
            }
            OUTPUT_STR += "</tr>";
            int rows = 0;
            while (rs.next()) {
                rows++;
                OUTPUT_STR += "<tr><td>"+rows+"</td>";
                for (int col = 0; col < columns; col++) {
                    OUTPUT_STR += "<td>" + rs.getString(col + 1) + "</td>";
                }
                OUTPUT_STR += "<tr>";
            }
            OUTPUT_STR += "</table>";
        } catch (SQLException ex) {
            OUTPUT_STR = "Error:\n"+ex.getMessage();
        }
        return OUTPUT_STR;
    }
}
