
$('#local_vid').draggable({
  containment: 'body',
  zIndex: 10000,
  // set start position at bottom right
  start: function (event, ui) {
    ui.position.left = $(window).width() - ui.helper.width();
    ui.position.top = $(window).height() - ui.helper.height();
  },
});

function checkVideoLayout() {
  const video_grid = document.getElementById("video_grid");
  const videos = video_grid.children;
  const video_count = videos.length;

  const totalVideos = Math.min(video_count, 30); // Limit to maximum of 30 videos

  // if (totalVideos == 0) {
  //   // Handle case when there are no videos
  // } else if (totalVideos == 1) {
  //   videos[0].style.width = "calc(100% - 15px)";
  //   videos[0].style.height = "calc(100vh - 15px)";
  //   videos[0].style.objectFit = "cover";
  // } else {
  //   for (let i = 0; i < totalVideos; i++) {
  //     videos[i].style.width = `calc(50% - 15px)`;
  //     videos[i].style.height = `calc(${
  //       100 / Math.ceil(totalVideos / 2)
  //     }vh - 15px)`;
  //     videos[i].style.objectFit = "cover";
  //   }
  // }

  if (totalVideos == 0) {
    // Handle case when there are no videos
  } else if (totalVideos == 1) {
    videos[0].style.width = "calc(100% - 10px)";
    videos[0].style.height = "calc(100% - 10px)";
    videos[0].style.objectFit = "cover";
  } else {
    const columns = Math.min(totalVideos, 3);
    const rows = Math.ceil(totalVideos / columns);
    console.log("columns: ", columns, " rows: ", rows);

    for (let i = 0; i < totalVideos; i++) {
      // Reset style properties after animation completes
      for (let i = 0; i < videos.length; i++) {
        videos[i].style.width = `calc(${100 / columns}% - 10px)`;
        videos[i].style.height = `calc(${100 / rows}% - 10px)`;
        videos[i].style.objectFit = "cover";
      }

      // Trigger reflow to apply initial styles before animation
      void video_grid.offsetWidth;

      // Apply fade-in and zoom-in animation to updated layout
      for (let i = 0; i < videos.length; i++) {
        videos[i].classList.add("fade-in-zoom-in");
      }
    }
  }
}

