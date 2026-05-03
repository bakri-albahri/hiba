import Show from "../CRUD/Show";

export default function StudyPlans(){
    
    return(
        <div className="study-plans">
             <Show page="studyPlans" endPoint="study-plans" pTitle="Study Plans" btn="Study Plan"/>
        </div>
    )
}