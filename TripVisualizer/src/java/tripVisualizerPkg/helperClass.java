package tripVisualizerPkg;

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
                whereCondition.append("AND ");
                return true;
            }
            return false;
    }
}
