# Getting Started

1. [Install Node.js](https://nodejs.org/en/download/). Node.js is a JavaScript runtime. It basically allows you to run JavaScript when not in a browser. For our purposes, this is not necessary. The important part is that with it comes `npm`, the Node Package Manager. This allows us to easily declare and install external dependencies such as [three.js](https://threejs.org/), [dat.GUI](https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage), and [glMatrix](http://glmatrix.net/). Some other packages we'll be using make it significantly easier to develop your code and create modules for better code reuse and clarity. These tools make it _signficantly_ easier to write code in multiple `.js` files without globally defining everything.

2. Fork and clone your repository.

3. In the root directory of your project, run `npm install`. This will download all of those dependencies.

4. Do either of the following (but I highly recommend the first one for reasons I will explain later).

    a. Run `npm start` and then go to `localhost:7000` in your web browser

    b. Run `npm run build` and then go open `index.html` in your web browser

    You should hopefully see the framework code with a 3D cube at the center of the screen!


# Developing Your Code
All of the JavaScript code is living inside the `src` directory. The main file that gets executed when you load the page as you may have guessed is `main.js`. Here, you can make any changes you want, import functions from other files, etc. The reason that I highly suggest you build your project with `npm start` is that doing so will start a process that watches for any changes you make to your code. If it detects anything, it'll automagically rebuild your project and then refresh your browser window for you. Wow. That's cool. If you do it the other way, you'll need to run `npm build` and then refresh your page every time you want to test something.

# Publishing Your Code
We highly suggest that you put your code on GitHub. One of the reasons we chose to make this course using JavaScript is that the Web is highly accessible and making your awesome work public and visible can be a huge benefit when you're looking to score a job or internship. To aid you in this process, running `npm run deploy` will automatically build your project and push it to `gh-pages` where it will be visible at `username.github.io/repo-name`.

# What is Actually Happening?
You can skip this part if you really want, but I highly suggest you read it.

## npm install
`npm install` will install all dependencies into a folder called `node_modules`. That's about it.

## package.json

This is the important file that `npm` looks at. In it, you can see the commands it's using for the `start`, `build`, and `deploy` scripts mentioned above. You can also see all of the dependencies the project requires. I will briefly go through what each of these is.
 - dat-gui: Gives us a nice and simple GUI for modifying variables in our program
 
 - gl-matrix: Useful library for linear algebra, much like glm

 - stats-js: Gives us a nice graph for timing things. We use it to report how long it takes to render each frame

 - three: Three.js is the main library we're using to draw stuff

 - three-orbit-controls: Handles mouse / touchscreen camera controls

 - babel-core, babel-loader, babel-preset-es2015: JavaScript is a a really fast moving language. It is constantly, constantly changing. Unfortunately, web browsers don't keep up nearly as quickly. Babel does the job of converting your code to a form that current browsers support. This allows us to use newer JavaScript features such as classes and imports without worrying about compatibility.

 - gh-pages-deploy: This is the library that automates publishing your code to Github

 - webpack: Webpack serves the role of packaging your project into a single file. Browsers don't actually support "importing" from other files, so without Webpack, to access data and functions in other files we would need to globally define EVERYTHING. This is an extremely bad idea. Webpack lets us use imports and develop code in separate files. Running `npm build` or `npm start` is what bundles all of your code together.

- webpack-dev-server: This is an extremely useful tool for development. It essentially creates a file watcher and rebuilds your project whenever you make changes. It also injects code into your page that gets notified when these changes occur so it can automatically refresh your page.

 - webpack-glsl-loader: Webpack does much more than just JavaScript. We can use it to load glsl, css, images, etc. For whatever you want to import, somebody has probably made a webpack loader for it.

## webpack.config.js

This is the configuration file in webpack. The most important part is `entry` and `output`. These define the input and output for webpack. It will start from `entry`, explore all dependencies, and package them all into `output`. Here, the `output` is `bundle.js`. If you look in `index.html`, you can see that the page is loading `bundle.js`, not `main.js`.

The other sections are just configuration settings for `webpack-dev-server` and setup for loading different types of files.