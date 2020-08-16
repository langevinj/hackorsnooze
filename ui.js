$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $favoritedArticles = $("#favorited-articles");
  const $myArticles = $("#my-articles");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");//going to use for favorited articles
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navaddStory = $("#nav-addStory");
  let favView = false;

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();
  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  //makes visible the form to add a new story
  $navaddStory.on("click", function(e){
    $submitForm.show();
    $('#submit-form').on('click', async function (e) { e.preventDefault(); addNewStory();});
  });

  //takes in info of 
  async function addNewStory(){
      //grab title, author, url
      const title = $("#title").val();
      const author = $("#author").val();
      const url = $("#url").val();
      //makes sure all inputs are typed in, but doesn't currently check if valid
      if(!title || !author || !url){
        resetForm();
        return;
      }
      
      let newStory = {"author":`${author}`, "title":`${title}`, "url":`${url}`};
      await storyList.addStory(currentUser, newStory);
      generateStories();
      $submitForm.hide();
      $submitForm.trigger("reset");
  };


  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

 //Logout functionality
  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });


  //Event Handler for clicking Login
  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });


  //Event handler for Navigation to Homepage
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
    favView = false;
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */
  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    // console.log(currentUser.favorites);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */
  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**Event handler for click My Stories
   * 
   */
  $('#view-myStories').on("click", function(e){
    e.preventDefault();
    showOwnStories();
    console.log(currentUser.ownStories)
    favView = false;
  })

  //shows only the users own stories
  function showOwnStories() {
    //hide the all-articles section
    hideElements();
    $myArticles.show();
    console.log()

    if ($('#my-articles > li').length === 0) {
      for (article of currentUser.ownStories) {
        let tempStory = generateStoryHTML(article);
        tempStory.prepend('<a href="#" id="removeArticle" class="fa fa-trash" aria-hidden="true"><a>');
        $myArticles.append(tempStory);
      }
    }
  }

  //event handler for trask bine that removes a story
  $('#my-articles').on("click", "#removeArticle", function(e){
    e.preventDefault();
    currentUser.removeStory(e.target.parentNode.id);
    e.target.parentNode.remove();
  })

  /**Event handler for the Favorites view */
  $('#view-favs').on("click", function(e){
    e.preventDefault();
    showFavorites();
    favView = true;
  });

  // empties favorite article list and adds all current favorites
  function showFavorites(){
    $favoritedArticles.empty();
    showOnlyFavorites();
  }

  //hides all but the favorited stories, then generates a story for each favorited one and appends
  function showOnlyFavorites() {
    //hide the all-articles section
    hideElements();
    $favoritedArticles.show();

    if (currentUser.favorites.length === 0){
        $favoritedArticles.prepend('<h3>No favorited stories to show</h3>');
    }

    for (favorite of currentUser.favorites) {
      let tempStory = generateStoryHTML(favorite);
      $favoritedArticles.prepend(tempStory);

      //fill in the stars indicating favorites when making the new favorites list
      tempStory.find('.favoriteArticle').html('&#9733');
    }
  }

  //returns true if a story is already a favorite
  function checkIfFavorite(tempId) {
    let curFavs = currentUser.favorites;
    let favArr = [];
    for (let i = 0; i < curFavs.length; i++) {
      favArr.push(curFavs[i].storyId);
    }
    return favArr.includes(tempId);
  }

  //add or removes a favorite and displays it as such
  $('body').on("click", '.favoriteArticle', function (e) {
    e.preventDefault();

    let tempId = e.target.parentNode.id;

    let isFav = checkIfFavorite(tempId);

    //if the story is a favorite, remove it and unfill the star, or vice versa
    if (!isFav) {
      currentUser.addFavorite(tempId);
      e.target.innerHTML = ('&#9733');
    } else {
      currentUser.removeFavorite(tempId);
      e.target.innerHTML = ('&#9734');
    }

    //when a story is unfavorited when just favorites are being viewed, remove that story element
    if (favView) {
      e.target.parentNode.remove();
      console.log(currentUser.favorites)
    }
  });


  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);

      //if the story is on the favorite list, display it as so, only if the current user is logged in
    if(currentUser){
      if(checkIfFavorite(story.storyId)){
        $(`#${story.storyId} > .favoriteArticle`).html('&#9733');
      };
    }
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <a class="favoriteArticle" href="#">&#9734</a>
        <a class="article-link" href="${story.url}" target="a_blank">${story.title}</a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    
    return storyMarkup;
  }

  /* hide all elements in elementsArr */
  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $loginForm,
      $createAccountForm,
      $myArticles,
      $favoritedArticles,
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navaddStory.show();
  }

  /* simple function to pull the hostname from a URL */
  function getHostName(url) {//utility
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {//utility
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
