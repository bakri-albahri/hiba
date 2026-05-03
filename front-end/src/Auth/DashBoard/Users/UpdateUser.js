import Update from "../CRUD/Update";
export default function UpdateUser(){
    return(
    <div className="updateUser">
        <Update page="updateUser" endPoint="users" pTitle="User" allBtn="Users"/>
    </div>
    )
}