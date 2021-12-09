export default class PlaybackQueue {
  songs = [];

  addSong(song) {
    songs.push(song);
    return songs.length;
  }

  getSongAt(index) {
    if (songs.length > index) {
      return songs[index];
    } else {
      return null;
    }
  }

  playNextSong() {
    if (songs.length > 0) {
      return songs.shift();
    } else {
      return null;
    }
  }

  getUserPosition(userID) {
    songs.forEach((s, i) => {
      if (s.getUserID() == userID) return i;
    });
  }
}
