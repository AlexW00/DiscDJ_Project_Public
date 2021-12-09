class Song {
  constructor(youtubeURL, userID, memberID, createdAt) {
    this.url = youtubeURL;
    this.userID = userID;
    this.memberID = memberID;
    this.createdAt = createdAt;
  }

  async getSongInfo() {
    const ytly = require("ytly");
    if (this.songInfo == undefined) {
      this.songInfo = await ytly.get.info(this.url);
    }
    console.log(this.songInfo);
    return this.songInfo;
  }

  getUserID() {
    return this.userID;
  }
  getMemberID() {
    return this.memberID;
  }
}
module.exports = Song;
