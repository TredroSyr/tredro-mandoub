// Stable direct-download link for the Drive file at:
// https://drive.google.com/file/d/1nwYpaXG6kuUp08YrJzrxWxgxrvIIANT_/view?usp=drive_link
// (bypasses Drive's "can't scan for viruses" interstitial that large files get)
const APK_FILE_ID = "1nwYpaXG6kuUp08YrJzrxWxgxrvIIANT_";
const APK_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${APK_FILE_ID}&export=download&confirm=t`;

export default function DownloadAppPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${APK_DOWNLOAD_URL}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(APK_DOWNLOAD_URL)});`,
        }}
      />
    </>
  );
}
