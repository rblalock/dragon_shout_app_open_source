# Dragon Shout App - Open Source App

## What is this?

This is an open source version of the popular [Dragon Shout App](https://itunes.apple.com/us/app/dragon-shout-app-2/id690208182?ls=1&mt=8)
for Skyrim / Oblivion / Morrowind / Elder Scrolls Online.  Some info about the app:

- Downloaded over 400,000 times
- [Ctrl+Alt+Del Featured Comic](http://www.cad-comic.com/cad/20111130/)
- Featured on TouchArcade, USA Today, Joystiq, and many more
- Over 100K community searchable markers

## See a quick preview

The quickest way to see how this works is to go to the app store and try it out:
[App Store Link](https://itunes.apple.com/us/app/dragon-shout-app-2/id690208182?ls=1&mt=8)

## Support the Project

Hey so it's cool and all that this is now open source.  Consider supporting this project by [downloading the app in the app store](https://itunes.apple.com/us/app/dragon-shout-app-2/id690208182?ls=1&mt=8).

## Quick Installation

There's only a few things you'll need to do to get the app up and running.

1.  Get an Apple Developer account and download XCode: [Get an Apple Developer Account](developer.apple.com)
2.  The app is built in Titanium, so you will need to get that here: [Download Titanium](http://www.appcelerator.com/developers/)
3.  Follow any setup instructions Titanium Studio prompts you to do.
4.  Create a new alloy project in Titanium Studio (File -> New -> Alloy Project -> Default Alloy App).
5.  Place the files in this repo in to the `/app/` folder of your new project (overwrite everything)
5.  Run the iOS simulator: [Example here](https://wiki.appcelerator.org/display/tis/Getting+Started+with+Titanium+Studio#GettingStartedwithTitaniumStudio-Runningyourapplication)

## App Configuration

If you did the previous steps and ran the simulator, you'll notice a few things: 1. Icons are missing
and 2. There's some errors in the console.  I removed the [icons](http://www.glyphish.com/) since they're not open source.
The errors happen because you need to enter in your Parse.com app id and such.

### Parse.com Setup

The app uses Parse to store data such as the markers, comments, user accounts, etc.  This is an optional part of the
app but it won't function 100% right if you don't do this or remove the code that calls out to Parse.
Also, all the data interaction happens in `lib/model.js`,
so if you want to strip out Parse and put in another mBaas solution or your own web services, you'd do it there.

1.  Get a [Parse](http://parse.com) account.
2.  Open up `app/config.json`
3.  You'll immediately notice the `Parse:{}` object.  Paste in your Parse `applicationId` and `restKey`.
You can get those via the Parse dashboard for your app - Your App -> Settings -> Application Keys.

### Map Configuration

The `map:{}` object in `config.json` holds 3 properties:

- `defaultMap`: This is the index of the map image from the `maps` array to load first, the default.
- `mapType`: Right now this should just be `scrollView`.  I had started a webView version of the map but stopped
due to the horrible DOM support in a lot of Android devices.  The native scrollView is much more performant
anyway.
- `maps`: This is the array of maps that are available in the app.  The map menu type will use this to populate the
available options for the user to select.  Here's an overview of the properties for each map in this array:
	- `name`: The title / name that shows up in the interface.
	- `id`: The ID of this map.  This relates to markers and comments saved in Parse.  The map id is a column
	stored in Parse.
	- `image`: The image file name inside the `app/assets/images/map` folder
	- `width` && `height`: The dimensions of the map image

### Menu Configuration

The `menu:{}` object configures the global menu bar on the left side of the app.  The `primaryItems` and `secondaryItems`
differentiate where the icons will show up in the menu bar.  Properties for each menu is as follows:

- `name`: The menu item name
- `type`: The menu type points to the controller of the same name
- `icon`: The icon file to use in `app/assets/menu`

### Marker Configuration
`markerTypes:[]` are the values populated in the pickers inside the marker detail screen.  The user will select one
of these when placing a marker on the map.  They also will be a column in the Parse database relating to the marker
type that is saved.

`icons:{}` are the icons for each individual marker type.  These are placed in `app/assets/icons`.

`markerColors:{}`: There are 3 potential marker colors: friend, community, and favorite.  Specify the colors here.

### Tutorial Configuration
`tutorial:{}` is simply an indication of how many tutorial images should be loaded up when in tutorial mode.  The number
maps to the images found in `app/assets/tutorial`

## Quick, Architectural Overview

Note, everything below is in the `/app/` folder.  Some things aren't mentioned
as they're self-explanatory.  For Alloy architecture please
see the [docs](http://docs.appcelerator.com/titanium/latest/#!/guide/Alloy_Concepts)

- `controllers/mapType/scrollView`: This file handles all major things around the map such as touch events on the map,
when to load in markers for the map, etc.
- `controllers/index.js`: This is the bootstrap for the app.  The code here executes first when the app is launched
- `lib/core.js`: This is the app singleton which manages all aspects of the app at any given time.
- `lib/model.js`: Where all the Parse queries are made.  These can be converted to whatever mBaaS needed.
- `widgets/map`: This widget maintains everything related to the map such as current markers on it, hiding, showing
markers, etc.  `controllers/mapType/scrollView` maintains the app logic for the map where this module manages the
internals of it.
- `widgets/menu`: The menu UI widget.
- `widgets/messageBar`: The message bar UI widget for notifications and such.

## Legal
Dragon Shout App is developed by Rick Blalock and is Copyright (c) 2014 by Rick Blalock. All Rights Reserved.
The code and images are made available under the Apache Public License, version 2. See the LICENSE file for more information.

Dragon Shout App is not affiliated with or endorsed by the developers of Skyrim® or Bethesda Game Studios®.
