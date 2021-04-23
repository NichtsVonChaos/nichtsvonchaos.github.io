/*
 * Tab 'Categories' expand/close effect.
 */

$(function() {
  const childPrefix = "l_";
  const parentPrefix = "h_";
  const collapse = $(".collapse");

  /* close up top-category */
  collapse.on("hide.bs.collapse", function () { /* Bootstrap collapse events. */
    const parentId = parentPrefix + $(this).attr("id").substring(childPrefix.length);
    if (parentId) {
      $(`#${parentId} .iconfont.icon-FolderOpen-1`).attr("class", "iconfont icon-folder fa-fw");
      $(`#${parentId} i.iconfont`).addClass("rotate");
      $(`#${parentId}`).removeClass("hide-border-bottom");
    }
  });

  /* expand the top category */
  collapse.on("show.bs.collapse", function() {
    const parentId = parentPrefix + $(this).attr("id").substring(childPrefix.length);
    if (parentId) {
      $(`#${parentId} .iconfont.icon-folder`).attr("class", "iconfont icon-FolderOpen-1 fa-fw");
      $(`#${parentId} i.iconfont`).removeClass("rotate");
      $(`#${parentId}`).addClass("hide-border-bottom");
    }
  });

});
