pragma solidity ^0.5.2;

contract StudentEventPlannerBallot {
    struct Category {
        uint id;
        string name;
    }
    struct Event {
        uint id;
        string name;
        uint categoryId;
        uint voteCount;
    }
    struct Month {
        uint id;
        uint monthNumber;
        uint voteCount;
    }
    address chairperson;
    mapping(uint => Category) public categories;
    mapping(uint => Event) public events;
    mapping(uint => Month) public months;
    mapping(uint => mapping(address => bool)) hasVoted;
    mapping(address => bool) hasSelectedMonth;
    uint public categoryCount;
    uint public eventCount;
    uint public monthCount;
    // Modifiers
    modifier onlyChairperson(){
        require(msg.sender == chairperson, "User is not Chairperson");
        _;
    }
    // To check if a valid category ID is being passed
    modifier validCategory(uint _categoryId){
        require(_categoryId > 0 && _categoryId <= categoryCount, "Category is not valid");
        _;
    }
    // To check if event ID is valid
    // modifier validEvent(uint _eventId){
    //     require(_eventId > 0 && _eventId <= eventCount, "Event ID is not valid");
    //     _;
    // }
    modifier validEvent(uint[] memory _eventId){
        for(uint index = 0; index < _eventId.length; index++){
            require(_eventId[index] > 0 && _eventId[index] <= eventCount, "Event ID is not valid");
        }
        _;
    }
    modifier validMonth(uint _monthNumber){
        require(_monthNumber > 0 && _monthNumber <= 12, "Month is invalid");
        _;
    }
    modifier validMonthVote(uint _monthId) {
        require(_monthId > 0 && _monthId <= monthCount, "Voted month is invalid");
        _;
    }
    constructor() public {
        // Saving the address of the chairperson
        chairperson = msg.sender;
    }
    // Only chairperson can view the category names based on their ID. This helps the chairperson in adding new events to the appropriate categories
    function getCategoryName(uint _categoryId) public onlyChairperson validCategory(_categoryId) view returns (string memory _categoryName) {
        _categoryName = categories[_categoryId].name;
    }
    // Only a chairperson can add a new category
    function addCategory(string memory _name) public onlyChairperson {
        categoryCount ++;
        categories[categoryCount] = Category(categoryCount, _name);
    }
    // Only a chairperson can add a new event
    function addEvent(string memory _name, uint  _categoryId) public onlyChairperson validCategory(_categoryId) {
        eventCount ++;
        events[eventCount] = Event(eventCount, _name, _categoryId, 0);
    }
    function addMonth(uint _monthNumber) public onlyChairperson validMonth(_monthNumber){
        monthCount ++;
        months[monthCount] = Month(monthCount, _monthNumber, 0);
    }
    // function voteEvent(uint _eventId) public validEvent(_eventId) {
    //     // Check to see if the user has already voted under the category
    //     require(!hasVoted[events[_eventId].categoryId][msg.sender], "User has already selected an event in this category");
    //     hasVoted[events[_eventId].categoryId][msg.sender] = true;
    //     events[_eventId].voteCount ++;
    // }
    function voteEvent(uint[] memory _eventId) public validEvent(_eventId) {
        // Check to see if the user has already voted under the category
        for(uint index = 0; index < _eventId.length; index++){
            require(!hasVoted[events[_eventId[index]].categoryId][msg.sender], "User has already selected an event in this category");
            hasVoted[events[_eventId[index]].categoryId][msg.sender] = true;
            events[_eventId[index]].voteCount ++;
        }
    }
    function voteMonth(uint _monthId) public validMonthVote(_monthId) {
        require(!hasSelectedMonth[msg.sender], "User has already selected a month");
        hasSelectedMonth[msg.sender] = true;
        months[_monthId].voteCount ++;
    }
    // Used to find winners under all the categories
    function getTotalCategoryCount() public onlyChairperson view returns (uint _categoryCount) {
        _categoryCount = categoryCount;
    }
    // Winner for the categoryID passed OR winner for each category??? Can this function be called multiple times with different category IDs?
    function requestWinningEvent(uint _categoryId) public view validCategory(_categoryId) onlyChairperson returns (string memory topVotedEvent) {
        uint maxVotes = 0;
        for(uint eventId = 1; eventId <= eventCount; eventId ++){
            if(events[eventId].categoryId == _categoryId && events[eventId].voteCount > maxVotes){
                maxVotes = events[eventId].voteCount;
                topVotedEvent = events[eventId].name;
            }
        }
        assert(maxVotes >= 1);
    }
    function requestWinningMonth() public view onlyChairperson returns (uint _monthNumber) {
        uint maxVotes = 0;
        for(uint monthId = 1; monthId <= monthCount; monthId ++){
            if(months[monthId].voteCount > maxVotes) {
                maxVotes = months[monthId].voteCount;
                _monthNumber = months[monthId].monthNumber;
            }
        }
        assert(maxVotes >= 1);
    }
}