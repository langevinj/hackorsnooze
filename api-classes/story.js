/**
 * Class to represent a single story.
 */

class Story {

    /**
     * The constructor is designed to take an object for better readability / flexibility
     * - storyObj: an object that has story properties in it
     */

    constructor(storyObj) {
        this.author = storyObj.author;
        this.title = storyObj.title;
        this.url = storyObj.url;
        this.username = storyObj.username;
        this.storyId = storyObj.storyId;
        this.createdAt = storyObj.createdAt;
        this.updatedAt = storyObj.updatedAt;
    }
}