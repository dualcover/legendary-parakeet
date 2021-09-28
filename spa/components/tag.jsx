var Tag = ({ color, icon, children, bold }) => <span className={`w3-tag w3-padding w3-round ${color ? color.indexOf('w3') === 0 ? color : ('w3-' + color) : "w3-theme-l2"}`}>
    {icon && <>
        <i className={"fa fa-" + icon}></i>
        {"\u00a0"}
    </>}
    {bold && <b>{children}</b>}
    {!bold && children}
</span>