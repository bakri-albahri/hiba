import Add from "../CRUD/Add";
export default function AddCourse() {

    return (
        <div className="add_Dept">
            <Add  page="addCourse" endPoint="courses" pTitle="Course" allBtn="Courses" />  
        </div>
    )
}