var Address = ({ isContract, shorten, address }) => <>
    {(isContract === true || isContract !== '0x') && <>
        <i className="fa fa-file"></i>
        {"\u00a0"}
    </>}
    {shorten && window.shortenWord(address, 20)}
    {!shorten && address}
</>;