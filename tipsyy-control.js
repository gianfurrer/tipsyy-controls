function VideoControls(video, player=undefined) {
  if (video.control || video.parentElement.nodeName == "VIDEO-WRAPPER") {
    console.warn("This video already has video controls");
    return video.control;
  }
  
  const isStream = player != undefined;
  
  //Helper Functions 
  const isMobile = window.ontouchstart !== undefined;
  const getTimeFormat = totalSeconds => {
    hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    minutes = Math.floor(totalSeconds / 60);
    seconds = Math.floor(totalSeconds % 60).toString();
    return (hours ? (hours + ":") : "") + minutes + ":" + seconds.padStart(2, "0");
  }

  const initSwitch = (player, dropdownOptions, appendTo, onclickFunction) => {
    const addOption = (track) => {
      const li = document.createElement("li");
      li.textContent = track.label || track.value;
      li.onclick = () => {
        onclickFunction(track.value);
        Array.from(li.parentElement.children).forEach(o => o.className = "");      
        li.className = "active";
      }
      appendTo.appendChild(li);
    }

    for (let i = 0; i < dropdownOptions.length; ++i) {
      addOption(dropdownOptions[i])
    }
  }
  
  const newControlIcon = (type, icon, appendTo) => {
    const element = document.createElement(type);
    element.className = "material-icons";
    element.textContent = icon;
    appendTo.appendChild(element);
    return element;
  }
  
  const newDropdown = (name, icon, appendTo) => {
    const dropdownId = name+"-dropdown";
    const dropdownIcon = newControlIcon("a", icon, appendTo);
    dropdownIcon.classList.add("dropdown-trigger");
    dropdownIcon.setAttribute("data-target", dropdownId);
    dropdownIcon.href = "#";
    
    const dropdown = document.createElement("ul");
    dropdown.id = dropdownId;
    dropdown.className = "dropdown-content";
    appendTo.appendChild(dropdown);
    return [dropdownIcon, dropdown];
  }
  
  //Create Elements
  const wrapper = document.createElement("video-wrapper");
  video.before(wrapper);
  wrapper.appendChild(video);
  
  const controlsWrapper = document.createElement("video-controls");
  wrapper.appendChild(controlsWrapper);
  
  const stickyBottom = document.createElement("sticky-bottom");
  controlsWrapper.appendChild(stickyBottom);
  
  const controlsRow = document.createElement("div");
  controlsRow.className = "row";
  stickyBottom.appendChild(controlsRow);
  
  const leftAlign = document.createElement("div");
  leftAlign.className = "left";
  controlsRow.appendChild(leftAlign);
  
  const playPause = newControlIcon("button", "play_arrow", leftAlign);
  
  const timeWrapper = document.createElement("time-wrapper");
  leftAlign.appendChild(timeWrapper);
  
  const newTimeElement = (textContent="0:00") => {
    const timeElement = document.createElement("text");  
    timeElement.textContent = textContent;
    timeWrapper.appendChild(timeElement);
    return timeElement;
  }
  
  const currentTime = newTimeElement();
  const seperator = newTimeElement(" / ");
  const duration = newTimeElement();
  
  const rightAlign = document.createElement("div")
  rightAlign.className = "right";
  controlsRow.appendChild(rightAlign);
  
  const volumeWrapper = document.createElement("volume-wrapper");
  rightAlign.appendChild(volumeWrapper);
  
  const volumeSliderWrapper = document.createElement("div");
  volumeSliderWrapper.className = "range-field hide-on-small-and-down";
  volumeWrapper.appendChild(volumeSliderWrapper);
  
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = 0;
  volumeSlider.max = 1;
  volumeSlider.step = 0.001;
  volumeSlider.hidden = true;
  volumeSliderWrapper.appendChild(volumeSlider);
  
  const volumeIcon = newControlIcon("button", "volume_up", volumeWrapper);
  
  //Dropdowns
  const noStream = [undefined, undefined];
  
  const resolutionArray = isStream ? newDropdown("resolution", "high_quality", rightAlign) : noStream;
  const resolution = resolutionArray[0];
  const resolutionDropdown = resolutionArray[1]; 
  
  const captionArray = newDropdown("caption", "closed_caption", rightAlign)
  const caption = captionArray[0];
  const captionDropdown = captionArray[1];
  
  const languageArray = isStream ? newDropdown("language", "language", rightAlign) : noStream;
  const language = languageArray[0];
  const languageDropdown = languageArray[1];
  
  const fullscreen = newControlIcon("button", "fullscreen", rightAlign);
  
  const timeRow = document.createElement("div");
  timeRow.className = "range-field";
  stickyBottom.appendChild(timeRow);
  
  const timeSlider = document.createElement("input");
  timeSlider.type = "range";
  timeSlider.min = 0;
  timeSlider.value = 0;
  timeSlider.step = 0.01;
  timeRow.appendChild(timeSlider);
  
   video.onloadeddata = () => {
    duration.textContent = getTimeFormat(video.duration); 
    timeSlider.max = Math.floor(video.duration);
  }
  video.duration && video.onloadeddata();
  
  //Trigger Controls
  let lastMouseMove = Date.now();
  let hasHover = !isMobile;
  
  const hideControls = (interval=2000, force=false) => {
    setTimeout(() => {
      if (!force && (video.paused || (Date.now() - lastMouseMove) < interval || hasHover)) {
        return;
      }
      controlsWrapper.hidden = true;
    }, interval);
  }
 
  const rows = [controlsRow, timeRow];
  for (let i = 0; i < rows.length; ++i) {
   const row = rows[i];
   row.onmouseover = () => { !isMobile && (hasHover = true); }
   row.onmouseout = () => { hasHover = false; hideControls(); }
  }
  
  const interaction = () => {
    controlsWrapper.hidden = false;
    lastMouseMove = Date.now();
    if (!hasHover) {
      hideControls(); 
    }
  }
  
  video.onmousemove = controlsWrapper.onmousemove = () => {
    interaction();
  }
  
  video.onmouseleave = controlsWrapper.onmouseleave = () => { 
    !hasHover && hideControls(300); 
  }
  
  video.onended = () => { interaction(); }
  
  //Update UI
  video.onplay = video.onpause = () => { playPause.textContent = video.paused ? "play_arrow" : "pause";} 
  video.onvolumechange = () => { 
    volumeIcon.textContent = (video.volume && !video.muted) ? "volume_up" : "volume_off"; 
    volumeSlider.value = video.volume;
  }
  video.onfullscreenchange = video.onwebkitfullscreenchange = e => { 
    fullscreen.textContent = document.fullscreen? "fullscreen_exit" : "fullscreen"; 
  }
  
  let selected = false;
  setInterval(() => {
    if (!video.paused) {
      currentTime.textContent = getTimeFormat(video.currentTime); 
      !selected && (timeSlider.value = video.currentTime);
    }
  }, 50);
  
  //Play Pause
  const playPauseAction = e => { (video.paused && video.play()) || video.pause();  }
  playPause.onclick = playPauseAction;
  
  //Volume Control
  volumeSlider.value = video.volume;
  volumeIcon.onclick = () => { video.muted = !video.muted; }
  volumeSlider.onchange = volumeSlider.onmousemove = () => { video.volume = volumeSlider.value; }
  
  if (isStream) {
    //Resolution
    let defaultLi;
    resolution.onclick = () => {
      if (!defaultLi) {
        return;
      }
      if (player.getConfiguration().abr.enabled) {
        const stats = player.getStats();
        defaultLi.textContent = `Auto (${stats.height}p)`;
      }
      else {
        defaultLi.textContent = "Auto";
      }
    } 
  
    const initResolutions = () => {
      const tracks = player.getVariantTracks();
      const activeTrack = tracks.filter(t => t.active)[0];
      const sameLanguage = tracks.filter(t => t.language == activeTrack.language);
      resolutionDropdown.innerHTML = "";
      defaultLi = document.createElement("li");
      defaultLi.textContent = "Auto"
      defaultLi.onclick = () => { player.configure({ abr: { enabled: true }}); }
      resolutionDropdown.appendChild(defaultLi);
      sameLanguage.sort((a,b) => a.videoBandwidth - b.videoBandwidth).forEach(track => {
        const li = document.createElement("li");
        li.textContent = track.height+"p";
        li.onclick = () => {
          player.configure({ abr: { enabled: false }});
          player.selectVariantTrack(track);
        }
        resolutionDropdown.appendChild(li);
      });
    }
    initResolutions();
    
    //Languages
    const languages = player.getAudioLanguagesAndRoles().map(l => [{
      label: (l.role && l.role != "main") ? l.role : "",
      value: l.language 
    }][0]);
    initSwitch(player, languages, languageDropdown, value => { player.selectAudioLanguage(value); initResolutions(); });
    
    
    //Stream Captions
    const textTracks = player.getTextTracks().map(t => [{
      label: t.label,
      value: t.language
    }][0]);
    textTracks.push({label: "Off", value:"no-caption"});
    initSwitch(player, textTracks, captionDropdown, value => {
      if (value == "no-caption") {
          player.setTextTrackVisibility(false);
      }
      else {
        player.selectTextLanguage(value);
        player.setTextTrackVisibility(true);
      }
    });
  }
  else {
    //Video Captions
    const textTracks = Array.from(video.textTracks).map(t => [{label: t.label, value: t.language}][0]);
    if (textTracks.length) {
      textTracks.push({label: "Off", value:"no-caption"});
      initSwitch(player, textTracks, captionDropdown, value => {
        if (value == "no-caption") {
          const activeTrack = textTracks.filter(t => t.mode == "showing");
          if (!activeTrack.length) {
            return;
          } 
          activeTrack[0].mode = "hidden";
        }
        else {
          const track = textTracks.filter(t => t.language == value);
          if (!track.length) {
            return;
          }
          track[0].mode = "showing";
        }
      }); 
    }
    else {
      caption.remove();
      captionDropdown.remove();
    }
  }
  
  //Time Slider
  timeSlider.onchange = () => { video.currentTime = timeSlider.value; }
  timeSlider.onmousedown = () => { selected = true; }
  timeSlider.onmouseup = () => { selected = false; }
  
  //Fullscreen
  const fullscreenAction = e => {
    (document.fullscreen && document.exitFullscreen()) || wrapper.requestFullscreen();
  }
  fullscreen.onclick = fullscreenAction;
  
  //Mobile Compatibility
  if (isMobile) {
    video.ontouchend = e => { 
      if (e.target == video) {
        interaction(); 
      }
    }

    controlsWrapper.ontouchend = e => { 
      interaction();
      if (![video, controlsWrapper].includes(e.target)) {
        return;
      }
      hideControls(100, true);  
    }
  }
  
  //Desktop Shortcuts
  let dbl = false;
  controlsWrapper.onclick = video.onclick = e => {
    if (![video, controlsWrapper].includes(e.target) || isMobile) {
      return;
    }
    setTimeout(() => {
      if (!dbl) {
        playPauseAction();
      }
    }, 300);
  }
  
  controlsWrapper.ondblclick = video.ondblclick = e => {
    if (![video, controlsWrapper].includes(e.target) || isMobile) {
      return;
    }
    dbl = true;
    fullscreenAction();
    setTimeout(() => { dbl = false; }, 300);
  }
  
  //Init Dropdown
  M.Dropdown.init(controlsWrapper.querySelectorAll('.dropdown-trigger'));
}