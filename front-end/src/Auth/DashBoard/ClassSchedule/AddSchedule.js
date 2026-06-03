import Add from "../CRUD/Add";

export default function AddSchedule(){
     return (
            <div className="class-schedule">
                <Add page="AddSchedule" endPoint="class-schedules" pTitle="Schedule" allBtn="Schedules" />  
            </div>
        )
}