package tripVisualizerPkg;

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
}
