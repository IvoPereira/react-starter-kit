/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import FastClick from 'fastclick';
import { match } from 'universal-router';
import PageContext from 'react-page-context';
import routes from './routes';
import Location from './core/Location';
import { addEventListener, removeEventListener } from './core/DOMUtils';

// Restore the scroll position if it was saved into the state
function restoreScrollPosition(state) {
  if (state && state.scrollY !== undefined) {
    window.scrollTo(state.scrollX, state.scrollY);
  } else {
    window.scrollTo(0, 0);
  }
}

let renderComplete = (state, callback) => {
  const elem = document.getElementById('css');
  if (elem) elem.parentNode.removeChild(elem);
  callback(true);
  renderComplete = (s) => {
    restoreScrollPosition(s);

    // Google Analytics tracking. Don't send 'pageview' event after
    // the initial rendering, as it was already sent
    window.ga('send', 'pageview');

    callback(true);
  };
};

function render(container, state, component) {
  return new Promise((resolve, reject) => {
    try {
      ReactDOM.render(
        <PageContext>{component}</PageContext>,
        container,
        renderComplete.bind(undefined, state, resolve)
      );
    } catch (err) {
      reject(err);
    }
  });
}

function run() {
  let currentLocation = null;
  const container = document.getElementById('app');

  // Make taps on links and buttons work fast on mobiles
  FastClick.attach(document.body);

  // Re-render the app when window.location changes
  const removeLocationListener = Location.listen(location => {
    currentLocation = location;
    match(routes, {
      path: location.pathname,
      query: location.query,
      state: location.state,
      context: {
        insertCss: styles => styles._insertCss(),
      },
      render: render.bind(undefined, container, location.state),
    }).catch(err => console.error(err)); // eslint-disable-line no-console
  });

  // Save the page scroll position into the current location's state
  const supportPageOffset = window.pageXOffset !== undefined;
  const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat');
  const setPageOffset = () => {
    currentLocation.state = currentLocation.state || Object.create(null);
    if (supportPageOffset) {
      currentLocation.state.scrollX = window.pageXOffset;
      currentLocation.state.scrollY = window.pageYOffset;
    } else {
      currentLocation.state.scrollX = isCSS1Compat ?
        document.documentElement.scrollLeft : document.body.scrollLeft;
      currentLocation.state.scrollY = isCSS1Compat ?
        document.documentElement.scrollTop : document.body.scrollTop;
    }
  };

  addEventListener(window, 'scroll', setPageOffset);
  addEventListener(window, 'pagehide', () => {
    removeEventListener(window, 'scroll', setPageOffset);
    removeLocationListener();
  });
}

// Run the application when both DOM is ready and page content is loaded
if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body) {
  run();
} else {
  document.addEventListener('DOMContentLoaded', run, false);
}
