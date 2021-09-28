var Address = ({ isContract, shorten, address, value }) => <>
    {(isContract === true || isContract !== '0x') && <>
        <i className="fa fa-file"></i>
        {"\u00a0"}
    </>}
    <a target="_blank" href={window.getEtherscanAddress(`address/${value}`)} onClick={e => e.stopPropagation()}>
        {shorten && window.shortenWord(address, 20)}
        {!shorten && address}
    </a>
</>;