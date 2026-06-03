import Show from "../CRUD/Show";

export default function ClassSchedule(){
    return(
        <div className="class-schedule">
            <Show page="ClassSchedule" endPoint="class-schedules" pTitle="Class Schedules" btn="Schedule"/>
        </div>
    )
}