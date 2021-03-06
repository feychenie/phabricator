/**
 * @provides javelin-behavior-project-boards
 * @requires javelin-behavior
 *           javelin-dom
 *           javelin-util
 *           javelin-stratcom
 *           javelin-workflow
 *           phabricator-draggable-list
 */

JX.behavior('project-boards', function(config) {

  function finditems(col) {
    return JX.DOM.scry(col, 'li', 'project-card');
  }

  function onupdate(node) {
    JX.DOM.alterClass(node, 'project-column-empty', !this.findItems().length);
  }

  function onresponse(response, item, list) {
    list.unlock();
    JX.DOM.alterClass(item, 'drag-sending', false);
    JX.DOM.replace(item, JX.$H(response.task));
  }

  function ondrop(list, item, after, from) {
    list.lock();
    JX.DOM.alterClass(item, 'drag-sending', true);

    var data = {
      objectPHID: JX.Stratcom.getData(item).objectPHID,
      columnPHID: JX.Stratcom.getData(list.getRootNode()).columnPHID
    };

    if (after) {
      data.afterPHID = JX.Stratcom.getData(after).objectPHID;
    }

    var workflow = new JX.Workflow(config.moveURI, data)
      .setHandler(function(response) {
        onresponse(response, item, list);
      });

    workflow.start();
  }

  var lists = [];
  var ii;
  var cols = JX.DOM.scry(JX.$(config.boardID), 'ul', 'project-column');

  for (ii = 0; ii < cols.length; ii++) {
    var list = new JX.DraggableList('project-card', cols[ii])
      .setFindItemsHandler(JX.bind(null, finditems, cols[ii]));

    list.listen('didSend', JX.bind(list, onupdate, cols[ii]));
    list.listen('didReceive', JX.bind(list, onupdate, cols[ii]));

    list.listen('didDrop', JX.bind(null, ondrop, list));

    lists.push(list);
  }

  for (ii = 0; ii < lists.length; ii++) {
    lists[ii].setGroup(lists);
  }

  var onedit = function(card, r) {
    var nodes = JX.$H(r.tasks).getFragment().firstChild;
    var new_card = JX.$H(r.tasks);
    JX.DOM.replace(card, new_card);
  };

  JX.Stratcom.listen(
    'click',
    ['edit-project-card'],
    function(e) {
      e.kill();
      var card = e.getNode('project-card');
      new JX.Workflow(e.getNode('tag:a').href, { 'response_type' : 'card' })
        .setHandler(JX.bind(null, onedit, card))
        .start();
    });

});
