const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/*This class maintains the list of individual Story instances, 
It also has some methods for fetching, adding, and removing stories*/
class StoryList {
    constructor(stories) {
        this.stories = stories;
    }

    /**
     * This method is designed to be called to generate a new StoryList.
     *  It:
     *  - calls the API
     *  - builds an array of Story instances
     *  - makes a single StoryList instance out of that
     *  - returns the StoryList instance.*
     */

    // TODO: Note the presence of `static` keyword: this indicates that getStories
    // is **not** an instance method. Rather, it is a method that is called on the
    // class directly. Why doesn't it make sense for getStories to be an instance method?
    //called on the entire StoryList always
    static async getStories() {
        // query the /stories endpoint (no auth required)
        const response = await axios.get(`${BASE_URL}/stories`);

        // turn the plain old story objects from the API into instances of the Story class
        const stories = response.data.stories.map(story => new Story(story));

        // build an instance of our own class using the new array of stories
        const storyList = new StoryList(stories);
        return storyList;
    }

    /*Make POST request to /stories and add the new story to the list
    -user- the current instance of User who will post story, -newStory- a new Story obj for the API
    returns the new story Obj*/
    async addStory(user, newStory) {
        const res = await axios.post(`${BASE_URL}/stories`, { "token": `${user.loginToken}`, "story": newStory });
        //creates new Story instance
        const addedStory = new Story(res.data.story);
        //adds new story to the front of the list
        this.stories.unshift(addedStory);

        user.ownStories.unshift(addedStory);
    }
}