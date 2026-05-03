import Show from "../CRUD/Show";

export default function Users() {

    return (
        <div className="users">
            <Show page="users" endPoint="users" pTitle="Users" btn="User"/>
        </div>
    )

}