    import { useEffect, useState } from "react";
import Update from "../CRUD/Update";
export default function UpdateProg(){
    
    
    return(
        <div className="program">
             <Update page="updateProgram" endPoint="programs" pTitle="Program" allBtn="Programs" />
        </div>
    )
}