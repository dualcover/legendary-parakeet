var Config = React.createClass({
    refresh() {
        clearTimeout(this.getStateVar("refreshTimeoutId"));
        var f = this.getStateVar("file");
        if(!f) {
            return;
        }
        var _this = this;
        fetch(URL.createObjectURL(f)).then(it => it.text()).then(text => _this.emit('dump', JSON.parse(text))).then(() => _this.setStateVar("refreshTimeoutId", 0/*setTimeout(_this.refresh, _this.getStateVar("refreshTimeout"))*/));
    },
    render() {
        var _this = this;
        var [file, setFile] = useState(null, "file");
        var [refreshTimeout, setRefreshTimeout] = useState(5000, "refreshTimeout");
        var [refreshTimeoutId, setRefreshTimeoutId] = useState(0, "refreshTimeoutId");
        useEffect(this.refresh, [file]);
        useEffect(() => {
            clearTimeout(refreshTimeoutId);
            setRefreshTimeoutId(setTimeout(_this.refresh, refreshTimeout));
        }, [refreshTimeout]);
        return (
            <div className="w3-theme-dark w3-bar w3-card-2">
                <label className="w3-bar-item">
                    Dump file:
                    <input type="file" accept=".json" onChange={e => {
                        setFile(e.currentTarget.files && e.currentTarget.files.length > 0 ? e.currentTarget.files[0] : null);
                        try {
                            e.currentTarget.value = "";
                        } catch(e) {
                        }
                        try {
                            e.currentTarget.files=new DataTransfer().files;
                        } catch(e) {
                        }
                    }}/>
                </label>
                {/*<div className="w3-bar-item">
                    Refresh timeout:
                    {'\u00a0'}
                    {refreshTimeout / 1000}
                    {'\u00a0'}
                    seconds
                    {'\u00a0'}
                    <a className="w3-button w3-circle w3-ripple w3-theme" href="javascript:void(0)" onClick={() => setRefreshTimeout(refreshTimeout + 1000)}>+</a>
                    <a className="w3-button w3-circle w3-ripple w3-theme" href="javascript:void(0)" onClick={() => setRefreshTimeout(refreshTimeout === 1000 ? refreshTimeout : refreshTimeout - 1000)}>-</a>
                </div>
                <div className="w3-bar-item">
                    <a className="w3-button w3-theme" href="javascript:void(0)" onClick={this.refresh}>Refresh now</a>
                </div>*/}
            </div>
        );
    }
});