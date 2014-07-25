<%-- 
    Document   : output_helper
    Created on : 25.7.2014, 17:27:53
    Author     : Vítek Růžička
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<select name="age" id="age">
<%
    //<option value=""></option>
    int i;
    for (i=5; i<86; i++) {
        out.print("<option value=\""+i+"\">"+i+"</option>");
    }
    %>
</select>