import Update from "../CRUD/Update";

export default function UpdateCourse() {

    return (
        <div className="add_Course">
            <Update page="updateCourse" endPoint="courses" pTitle="Course" allBtn="Courses" />
        </div>
    )
}