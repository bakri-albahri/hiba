import Show from "../CRUD/Show";

export default function Courses(){
    
    return(
        <div className="courses">
             <Show page="courses" endPoint="courses" pTitle="Courses" btn="Course"/>
        </div>
    )
}