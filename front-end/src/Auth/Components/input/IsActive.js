export default function IsActive(props){
    return(
        <div className="input">
            <label htmlFor="isActive">Is Active : </label>
            <select
            id="isActive"
            className="select-items"
            value={props.isActive ? "1" : "0"}
            onChange={(e) => props.setIsActive(e.target.value)}
            >
                <option value="">Is Active ?</option>
                <option value="1">True</option>
                <option value="0">False</option>
            </select>
            {/* {!isActive & accept ? <p className="form-error"> Study Plan Active Status Is Required !</p> : ""} */}
        </div>
    )
}