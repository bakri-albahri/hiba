import { useEffect, useState } from "react";
import Add from "../CRUD/Add";
export default function AddProg(){
    return(
        <div className="program">
             <Add  page="addProg" endPoint="programs" pTitle="Program" allBtn="Programs" addBtn="Program"/>
        </div>
    )
}