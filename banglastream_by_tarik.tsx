import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Pause, Maximize, Minimize, Volume2, VolumeX, Loader2, 
  Server, Radio, AlertTriangle, Search, Users, Tv, PictureInPicture
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

// --- FIREBASE SETUP ---
let app, auth, db, appId;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  }
} catch (e) {
  console.error("Firebase init failed:", e);
}

// --- VERIFIED LOGO MAP (Fixing fake/missing logos) ---
const LOGO_MAP = {
  "channel i": "https://upload.wikimedia.org/wikipedia/en/2/29/Channel_i_logo.png",
  "somoy tv": "https://upload.wikimedia.org/wikipedia/commons/2/23/Somoy_TV_Logo_2021.png",
  "channel 24": "https://upload.wikimedia.org/wikipedia/en/e/eb/Channel_24_BD_logo.png",
  "independent tv": "https://upload.wikimedia.org/wikipedia/commons/0/05/Independent_Television_Bangladesh_Logo.png",
  "jamuna tv": "https://upload.wikimedia.org/wikipedia/en/c/c9/Jamuna_Television_logo.png",
  "dbc news": "https://upload.wikimedia.org/wikipedia/en/2/22/DBC_News_logo.png",
  "ekattor tv": "https://upload.wikimedia.org/wikipedia/en/e/e0/Ekattor_TV_Logo.png",
  "rtv": "https://upload.wikimedia.org/wikipedia/en/9/90/RTV_Logo.png",
  "deepto tv": "https://upload.wikimedia.org/wikipedia/en/0/0b/Deepto_TV_logo.png",
  "gazi tv": "https://upload.wikimedia.org/wikipedia/en/6/60/GTV_Logo.png",
  "gtv": "https://upload.wikimedia.org/wikipedia/en/6/60/GTV_Logo.png",
  "t sports": "https://upload.wikimedia.org/wikipedia/en/7/7b/T_Sports_Logo.png",
  "atn bangla": "https://upload.wikimedia.org/wikipedia/commons/5/52/ATN_Bangla_logo.png",
  "atn news": "https://upload.wikimedia.org/wikipedia/en/8/87/ATN_News_logo.png",
  "ekushey tv": "https://upload.wikimedia.org/wikipedia/en/1/15/Ekushey_Television_logo.png",
  "news 24": "https://upload.wikimedia.org/wikipedia/en/4/4e/News24_BD_logo.png",
  "bangla tv": "https://images.toffeelive.com/images/program/323/logo/240x240/mobile_logo_295116001655890974.png",
  "bijoy tv": "https://images.toffeelive.com/images/program/334/logo/240x240/mobile_logo_297127001655891072.png",
  "my tv": "https://upload.wikimedia.org/wikipedia/en/0/0e/My_TV_logo.png",
  "boishakhi": "https://upload.wikimedia.org/wikipedia/en/f/f6/Boishakhi_TV_logo.png",
  "desh tv": "https://upload.wikimedia.org/wikipedia/en/8/8c/Desh_TV_logo.png",
  "maasranga": "https://upload.wikimedia.org/wikipedia/en/3/30/Maasranga_Television_logo.png",
  "duronto": "https://upload.wikimedia.org/wikipedia/en/f/fe/Duronto_TV_logo.png",
  "ptv sports": "https://upload.wikimedia.org/wikipedia/commons/4/43/PTV_Sports_logo.png"
};

// --- INBUILT PREMIUM CHANNELS ---
const INBUILT_M3U = `
#EXTM3U

# --- SPORTS CHANNELS (Premium & Verified) ---
#EXTINF:-1 tvg-id="8a727fc195b3" tvg-logo="https://images.toffeelive.com/images/program/19779/logo/240x240/mobile_logo_975410001725875598.png" group-title="Sports",TOFFEE Sports
https://news.bajimath.com/Candy_Live/vstream.php?id=8a727fc195b3&e=.m3u8
#EXTINF:-1 tvg-id="e666b0d2a3ec" tvg-logo="https://images.toffeelive.com/images/program/304419/logo/115x115/mobile_logo_253140001742624618.png" group-title="Sports",IPL
https://news.bajimath.com/Candy_Live/vstream.php?id=e666b0d2a3ec&e=.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/en/7/7b/T_Sports_Logo.png" group-title="Sports",T Sports HD
https://tvsen7.aynaott.com/tsports-hd/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/en/6/60/GTV_Logo.png" group-title="Sports",GTV
https://news.bajimath.com/Candy_Live/vstream.php?id=a994bb5a55fc&e=.m3u8
#EXTINF:-1 tvg-id="43dcec1011e7" tvg-logo="https://images.toffeelive.com/images/program/603/logo/240x240/mobile_logo_237244001666780563.png" group-title="Sports",SONY SPORTS TEN 1 HD
https://news.bajimath.com/Candy_Live/vstream.php?id=43dcec1011e7&e=.m3u8
#EXTINF:-1 tvg-id="abc6677968ef" tvg-logo="https://images.toffeelive.com/images/program/604/logo/240x240/mobile_logo_093449001666780976.png" group-title="Sports",SONY SPORTS TEN 2 HD
https://news.bajimath.com/Candy_Live/vstream.php?id=abc6677968ef&e=.m3u8
#EXTINF:-1 tvg-id="fd6de8bd1666" tvg-logo="https://images.toffeelive.com/images/program/606/logo/240x240/mobile_logo_689539001672145843.png" group-title="Sports",SONY SPORTS TEN 5 HD
https://news.bajimath.com/Candy_Live/vstream.php?id=fd6de8bd1666&e=.m3u8
#EXTINF:-1 tvg-id="f76c7eb00da0" tvg-logo="https://images.toffeelive.com/images/program/301891/logo/240x240/mobile_logo_578686001735197654.png" group-title="Sports",SONY TEN Cricket
https://news.bajimath.com/Candy_Live/vstream.php?id=f76c7eb00da0&e=.m3u8
#EXTINF:-1 group-title="Sports",Sony Ten 1 HD (Alt)
https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/1709-audio_113392_eng=113200-video=442000.m3u8
#EXTINF:-1 group-title="Sports",Sony Ten 2 HD (Alt)
https://owrcovcrpy.gpcdn.net/bpk-tv/1702/output/1702-audio_113322_eng=113200-video=2202800.m3u8
#EXTINF:-1 group-title="Sports",Sony Sports 3 HD
https://owrcovcrpy.gpcdn.net/bpk-tv/1701/output/1701-audio_113312_eng=113200-video=2202800.m3u8
#EXTINF:-1 tvg-id="258468998307" tvg-logo="https://images.toffeelive.com/images/program/4388/logo/240x240/mobile_logo_422191001674119624.png" group-title="Sports",Euro Sport HD
https://news.bajimath.com/Candy_Live/vstream.php?id=258468998307&e=.m3u8
#EXTINF:-1 group-title="Sports",A Sports
https://tvsen7.aynaott.com/asports-bkp/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 group-title="Sports",A Sports Alt
https://tvsen6.aynaott.com/asports/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/4/43/PTV_Sports_logo.png" group-title="Sports",PTV Sports
https://tvsen5.aynaott.com/PtvSports/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 group-title="Sports",Saudi Sports (SPL)
https://kwtsplta.cdn.mangomolo.com/spl/smil:spl.stream.smil/chunklist_b3500000_t64NzIwcA==.m3u8
#EXTINF:-1 group-title="Sports",Willow TV / Extra Sports
https://d4ddgdmj1cvnm.cloudfront.net/scheduler/scheduleMaster/409/variant/22100005.m3u8
#EXTINF:-1 group-title="Sports",Sofast Sports
https://streams2.sofast.tv/v1/manifest/611d79b11b77e2f571934fd80ca1413453772ac7/e0b81a5c-6ab5-48cd-aaa9-f82de4ab5bf9/c7e3ed99-a72b-40d5-8b58-ac5861e7191c/1.m3u8
#EXTINF:-1 group-title="Sports",Pishow TV Live
https://cdn-6.pishow.tv/live/13/13_2.m3u8

# --- BD CHANNELS (Basic Essentials) ---
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/2/23/Somoy_TV_Logo_2021.png" group-title="News",Somoy TV
https://tvsen6.aynaott.com/somoytv/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/en/c/c9/Jamuna_Television_logo.png" group-title="News",Jamuna TV
https://tvsen6.aynaott.com/jamunatv/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/en/2/29/Channel_i_logo.png" group-title="Entertainment",Channel i
https://tvsen6.aynaott.com/channeli/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/en/9/90/RTV_Logo.png" group-title="Entertainment",RTV HD
https://tvsen5.aynaott.com/RtvHD/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/en/e/eb/Channel_24_BD_logo.png" group-title="News",Channel 24
https://tvsen6.aynaott.com/channel24/tracks-v1a1/mono.ts.m3u8
#EXTINF:-1 group-title="Entertainment",Deepto TV HD
https://tvsen5.aynaott.com/DeeptoTVHD/tracks-a1/mono.ts.m3u8
`;

// --- HLS VIDEO PLAYER (Optimized for Low Network & Quick Error Catching) ---
const HLSPlayer = ({ url, isPlaying, onError, isMuted, toggleMute, playerRef }) => {
  const internalVideoRef = useRef(null);
  const videoRef = playerRef || internalVideoRef;
  const hlsRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    if (!url || !videoRef.current) return;
    
    onError(false);
    setIsBuffering(true);
    let retryCount = 0;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        maxBufferLength: 10, // Network friendly: buffer less ahead
        maxMaxBufferLength: 20,
        enableWorker: true,
        lowLatencyMode: true,
        startFragPrefetch: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 10000,
      });
      
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        if (isPlaying) videoRef.current.play().catch(() => console.log("Autoplay blocked"));
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response && (data.response.code >= 400 || data.response.code === 0)) {
                // 404, 403 or absolute network failure -> Offline instantly
                hls.destroy();
                onError(true);
                setIsBuffering(false);
              } else if (retryCount < 2) {
                retryCount++;
                hls.startLoad();
              } else {
                hls.destroy();
                onError(true);
                setIsBuffering(false);
              }
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              if (retryCount < 2) {
                retryCount++;
                hls.recoverMediaError();
              } else {
                hls.destroy();
                onError(true);
                setIsBuffering(false);
              }
              break;
            default:
              hls.destroy();
              onError(true); 
              setIsBuffering(false);
              break;
          }
        }
      });

      // Handle Buffering UI
      videoRef.current.addEventListener('waiting', () => setIsBuffering(true));
      videoRef.current.addEventListener('playing', () => setIsBuffering(false));

    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari / iOS
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        if (isPlaying) videoRef.current.play().catch(() => {});
      });
      videoRef.current.addEventListener('error', () => {
        onError(true);
        setIsBuffering(false);
      });
      videoRef.current.addEventListener('waiting', () => setIsBuffering(true));
      videoRef.current.addEventListener('playing', () => setIsBuffering(false));
    }

    return () => { 
      if (hlsRef.current) hlsRef.current.destroy(); 
    };
  }, [url]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
      videoRef.current.muted = isMuted;
    }
  }, [isPlaying, isMuted]);

  return (
    <div className="relative w-full h-full bg-black group">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-contain md:object-cover bg-black"
        onClick={() => toggleMute(!isMuted)} // Optional: click to unmute
      />
      
      {/* Loading Spinner during Buffering */}
      {isBuffering && !onError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <Loader2 className="animate-spin text-green-500" size={48} />
        </div>
      )}
    </div>
  );
};

// --- SAFE & SMART CATEGORIZATION ---
const getCategoryForChannel = (rawName, rawGroup = '') => {
  const name = (rawName || '').toLowerCase();
  const group = (rawGroup || '').toLowerCase();
  
  if (name.match(/news|somoy|jamuna|dbc|independent|channel 24|bbc|cnn|ekattor/) || group === 'news') return 'News';
  if (name.match(/sport|espn|ten|tnt|sky|fox|ptv|fancode|icc|bein|willow|ipl|t sports/) || group.includes('sports')) {
    if (name.match(/cricket|star sports|ptv|willow|gtv|gazi|ipl/)) return 'Sports(Cricket)';
    if (name.match(/world cup|fifa|football/)) return 'Sports(Football)';
    return 'Sports(Misc)';
  }
  if (name.match(/movie|cinema|pictures/)) return 'Movies';
  return 'Entertainment';
};

// --- DYNAMIC ON-DEMAND URL SIGNER (Fast Load Logic) ---
const fetchAkamaiData = async () => {
  let akamaiKeyHex = null, userIp = null;
  try {
    const [ipRes, keyRes] = await Promise.all([
      fetch('https://api.ipify.org?format=json').catch(() => null),
      fetch('https://cloudtv.akamaized.net/AynaOTT/BDcontent/BD/products/66e88378c4ae462999bf0159_product.json').catch(() => null)
    ]);
    if (ipRes) { const d = await ipRes.json(); userIp = d.ip; }
    if (keyRes) { const k = await keyRes.json(); akamaiKeyHex = k.player.token.akamai_key; }
  } catch (e) { console.warn("Failed to fetch Akamai deps"); }
  return { akamaiKeyHex, userIp };
};

const signSingleUrl = async (url, akamaiKeyHex, userIp) => {
  if (!url || !url.includes('aynaott.com') || !akamaiKeyHex || !userIp) return url;
  try {
    const st = Math.floor(Date.now() / 1000);
    const exp = st + 43200;
    const acl = "/*"; 
    const dataStr = `${userIp}-WEB`;
    const queryParamData = `st=${st}~exp=${exp}~acl=${acl}~data=${dataStr}`;

    const keyBytes = new Uint8Array(akamaiKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(queryParamData));
    const hmacHash = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${url}?hdnts=${queryParamData}~hmac=${hmacHash}`;
  } catch(e) {
    return url;
  }
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [channels, setChannels] = useState([]);
  const [isParsing, setIsParsing] = useState(true);

  const categories = ["All", "News", "Entertainment", "Sports(Cricket)", "Sports(Football)", "Sports(Misc)", "Movies"];
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [focusedProgram, setFocusedProgram] = useState(null);
  const [focusedChannel, setFocusedChannel] = useState(null);
  const [activeUrlIndex, setActiveUrlIndex] = useState(0); 
  const [playableUrl, setPlayableUrl] = useState(null);
  
  const [realTime, setRealTime] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Auto-play policies usually require mute
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamError, setStreamError] = useState(false);

  // Refs for Fullscreen & PiP
  const appRef = useRef(null);
  const playerRef = useRef(null);

  // App-level state for signing
  const [akamaiData, setAkamaiData] = useState({ akamaiKeyHex: null, userIp: null });

  // Load HLS Script
  useEffect(() => {
    if (!document.getElementById('hls-script')) {
      const script = document.createElement('script');
      script.id = 'hls-script';
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Firebase Presence (Optimized Ping)
  useEffect(() => {
    if (!auth || !db) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error:", e); }
    };
    initAuth();
  }, []);

  const [viewers, setViewers] = useState(1);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const viewersRef = collection(db, 'artifacts', appId, 'public', 'data', 'viewers');
    const myDoc = doc(viewersRef, user.uid);

    const ping = () => setDoc(myDoc, { lastActive: Date.now() }).catch(()=>{});
    ping();
    const interval = setInterval(ping, 30000); // Network friendly: 30s ping instead of 10s

    const unsubSnap = onSnapshot(viewersRef, (snap) => {
      const now = Date.now();
      let active = 0;
      snap.forEach(d => { if (d.data().lastActive && (now - d.data().lastActive) < 60000) active++; });
      setViewers(active > 0 ? active : 1);
    }, () => {});

    return () => { clearInterval(interval); unsubSnap(); deleteDoc(myDoc).catch(()=>{}); };
  }, [user]);

  // Playlist Parsing
  const parsePlaylist = (data) => {
    const lines = data.split('\n');
    const parsed = [];
    let ch = null;

    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);

        const rawName = nameMatch ? nameMatch[1].trim() : 'Unknown';
        const rawGroup = groupMatch ? groupMatch[1] : '';
        const lowerName = rawName.toLowerCase();

        // Inject verified logos
        let finalLogo = logoMatch ? logoMatch[1] : null;
        const mappedKey = Object.keys(LOGO_MAP).find(k => lowerName.includes(k));
        if (mappedKey) finalLogo = LOGO_MAP[mappedKey];

        ch = {
          name: rawName,
          logo: finalLogo,
          category: getCategoryForChannel(rawName, rawGroup),
        };
      } else if (line !== '' && !line.startsWith('#') && ch) {
        ch.url = line;
        if (ch.url) parsed.push(ch);
        ch = null;
      }
    });
    return parsed;
  };

  // Initial Fetching
  useEffect(() => {
    const initApp = async () => {
      setIsParsing(true);
      
      // 1. Fetch Akamai Tokens async (doesn't block UI logic)
      fetchAkamaiData().then(setAkamaiData);

      // 2. Fetch playlists
      try {
        const [bdRes, spRes] = await Promise.all([
          fetch("https://iptv-org.github.io/iptv/countries/bd.m3u").catch(() => null),
          fetch("https://iptv-org.github.io/iptv/categories/sports.m3u").catch(() => null)
        ]);

        const bdData = bdRes ? await bdRes.text() : "";
        const spData = spRes ? await spRes.text() : "";

        const allRaw = [
          ...parsePlaylist(INBUILT_M3U),
          ...parsePlaylist(bdData),
          ...parsePlaylist(spData).slice(0, 150) // Limit sports increased for more options
        ];

        // Group duplicates
        const grouped = new Map();
        allRaw.forEach(c => {
          const norm = c.name.toLowerCase().replace(/hd|fhd|hevc|1080p/gi, '').trim();
          if (grouped.has(norm)) {
            let ex = grouped.get(norm);
            if (c.url && !ex.urls.includes(c.url)) {
              if (c.url.includes("aynaott") || c.url.includes("bajimath")) ex.urls.unshift(c.url);
              else ex.urls.push(c.url);
            }
          } else {
            grouped.set(norm, { ...c, urls: c.url ? [c.url] : [] });
          }
        });

        const finalList = Array.from(grouped.values()).map((c, i) => ({
          ...c,
          id: `ch_${i}`,
          number: (i + 1).toString().padStart(3, '0'),
          programs: [{ id: `p_${i}`, title: c.category.includes("Sports") ? "Live Sports Match" : (c.category === "News" ? "Live News Bulletin" : "Live Broadcast"), type: c.category }]
        }));

        setChannels(finalList);
        if (finalList.length > 0) {
          setFocusedChannel(finalList[0]);
          setFocusedProgram(finalList[0].programs[0]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsParsing(false);
      }
    };
    initApp();
  }, []);

  // Update Playable URL when channel/server changes
  useEffect(() => {
    let isMounted = true;
    const processUrl = async () => {
      if (!focusedChannel || !focusedChannel.urls[activeUrlIndex]) return;
      
      const rawUrl = focusedChannel.urls[activeUrlIndex];
      // Generate Signed URL ONLY when clicking the channel (Super Fast App Load)
      const finalUrl = await signSingleUrl(rawUrl, akamaiData.akamaiKeyHex, akamaiData.userIp);
      
      if (isMounted) {
        setPlayableUrl(finalUrl);
        setStreamError(false);
        setIsPlaying(true);
      }
    };
    processUrl();
    return () => { isMounted = false; };
  }, [focusedChannel, activeUrlIndex, akamaiData]);

  const handleChannelSelect = (ch, prog) => {
    setFocusedChannel(ch);
    setFocusedProgram(prog);
    setActiveUrlIndex(0);
  };

  const nextServer = () => {
    if (focusedChannel && focusedChannel.urls.length > 1) {
      setActiveUrlIndex((p) => (p + 1) % focusedChannel.urls.length);
    }
  };

  // --- ADVANCED FULLSCREEN & PIP LOGIC ---
  const toggleFullscreen = async () => {
    // If we are not currently in fullscreen (tracking by state variable to handle blocked iframe case)
    if (!isFullscreen) {
      try {
        if (appRef.current?.requestFullscreen) {
          await appRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        // Auto-rotate to landscape on mobile devices
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape').catch(e => console.log("Orientation lock failed", e));
        }
      } catch (err) {
        console.warn("Native fullscreen blocked, using CSS fallback:", err.message);
      }
      setIsFullscreen(true); // Always set to true so the CSS layout can adapt
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        // Unlock orientation when exiting
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      } catch (err) {
        console.warn("Exit native fullscreen blocked:", err.message);
      }
      setIsFullscreen(false); // Reset state
    }
  };

  // Sync Fullscreen State (Pressing ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      if (!isFs) {
        setIsFullscreen(false); // Ensure app leaves fullscreen when exiting natively
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Picture in Picture Toggle
  const togglePiP = async () => {
    if (!playerRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await playerRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.warn("PiP is blocked or not supported:", error.message);
    }
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const catMatch = activeCategory === "All" ? true : c.category === activeCategory;
      const searchMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [channels, activeCategory, searchQuery]);

  if (isParsing || channels.length === 0) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950 opacity-80" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
            <Radio className="text-green-500 animate-pulse" size={40} />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">BanglaStream</h2>
          <p className="text-gray-400 font-semibold mb-6 tracking-widest text-sm">BY TARIK</p>
          <div className="flex items-center text-gray-400 font-medium">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading Premium Networks...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={appRef} className={`w-full h-screen bg-black flex flex-col overflow-hidden font-sans select-none text-white ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      
      {/* Background Video Layer */}
      <div className="absolute inset-0 z-0 bg-zinc-900">
        
        {/* Error Overlay (Perfect Offline State) */}
        {streamError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={64} className="text-red-500" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">Stream Offline</h2>
            <p className="text-gray-400 text-lg mb-8 text-center max-w-md font-medium">
              The broadcast server is not responding or the link is temporarily dead.
            </p>
            {focusedChannel?.urls?.length > 1 ? (
              <button onClick={nextServer} className="flex items-center px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl">
                <Server size={24} className="mr-3" /> Auto-Fix (Try Server {activeUrlIndex + 2})
              </button>
            ) : (
              <span className="px-6 py-3 bg-zinc-800 text-gray-400 font-semibold rounded-xl border border-white/5">
                Alternative Server Unavailable
              </span>
            )}
          </div>
        )}
        
        <HLSPlayer 
          url={playableUrl} 
          isPlaying={isPlaying} 
          onError={setStreamError} 
          isMuted={isMuted}
          toggleMute={setIsMuted}
          playerRef={playerRef}
        />
        
        {/* Cinematic Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none z-10 opacity-90 transition-opacity duration-500 hover:opacity-100" />
      </div>

      {/* Main HUD / UI Layer */}
      <div className="flex-1 relative z-30 flex flex-col w-full h-full pointer-events-none p-6 md:p-10">
        
        {/* Top Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          {/* Left: Channel Info */}
          <div className="max-w-2xl transform transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wider shadow-lg ${streamError ? 'bg-zinc-800 text-gray-500 border border-zinc-700' : 'bg-red-600 text-white animate-pulse shadow-red-600/50'}`}>
                {streamError ? 'OFFLINE' : <><Radio size={12} className="mr-1.5" /> LIVE</>}
              </div>
              <span className="text-xl md:text-2xl font-bold text-gray-200 drop-shadow-lg flex items-center">
                CH {focusedChannel.number} <span className="mx-2 text-gray-500">•</span> {focusedChannel.name}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-2xl leading-tight">{focusedProgram.title}</h1>
            
            <div className="flex items-center space-x-3 text-sm font-semibold mb-6">
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-green-400 border border-green-400/20">{focusedProgram.type}</span>
              <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-gray-200 border border-white/10">1080p FHD</span>
            </div>

            {/* Premium Player Controls */}
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsPlaying(!isPlaying)} disabled={streamError} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:grayscale">
              {isPlaying && !streamError ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>

            <button onClick={() => setIsMuted(!isMuted)} className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors">
              {isMuted ? <VolumeX size={24} className="text-gray-400" /> : <Volume2 size={24} />}
            </button>

            {focusedChannel?.urls?.length > 1 && (
              <button onClick={nextServer} className="flex items-center px-5 h-14 rounded-full bg-black/40 backdrop-blur-xl text-white hover:bg-white/10 border border-white/10 transition-colors font-medium">
                <Server size={20} className="mr-2 text-green-400" />
                Srv {activeUrlIndex + 1}/{focusedChannel.urls.length}
              </button>
            )}

            <button onClick={togglePiP} className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors" title="Picture in Picture">
              <PictureInPicture size={24} />
            </button>

            <button onClick={toggleFullscreen} className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors" title="Fullscreen">
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>

        {/* Right: Stats & Brand */}
        <div className="flex flex-col items-end space-y-4 pointer-events-auto">
          <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center text-black shadow-inner">
              <Tv size={22} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col pr-2">
              <span className="font-extrabold text-xl leading-none tracking-tight">BanglaStream</span>
              <span className="text-[10px] uppercase text-green-400 font-bold tracking-widest mt-0.5">By Tarik</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-red-500/10 backdrop-blur-xl border border-red-500/20 px-4 py-2 rounded-xl">
            <Users size={16} className="text-red-400" />
              <span className="font-bold text-red-400 text-sm">{viewers.toLocaleString()} Watching</span>
            </div>

            <div className="text-3xl font-light tracking-tighter drop-shadow-lg text-white/90">
              {realTime}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Panel (EPG / List) - Only show if not full screen or if mouse moves */}
        <div className={`transition-all duration-500 transform ${isFullscreen ? 'translate-y-full opacity-0 absolute bottom-0 left-0 w-full' : 'translate-y-0 opacity-100'} h-[45vh] max-h-[400px] bg-black/60 backdrop-blur-2xl border border-white/10 flex flex-col rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden mx-auto w-full max-w-7xl`}>
          
          {/* Filters & Search Header */}
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5">
            <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-3 md:pb-0 hide-scrollbar">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-green-500 text-black shadow-lg shadow-green-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-black/50 border border-white/10 rounded-full px-4 py-2 w-full md:w-72 mt-2 md:mt-0 focus-within:border-green-500/50 transition-colors">
              <Search className="text-gray-400 mr-2" size={18} />
              <input
                type="text"
                placeholder="Find channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Channel Grid/List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredChannels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredChannels.map((ch) => {
                  const isActive = focusedChannel?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleChannelSelect(ch, ch.programs[0])}
                      className={`flex items-center p-3 rounded-2xl border transition-all text-left outline-none focus:ring-2 focus:ring-green-500/50 ${isActive ? 'bg-white/10 border-green-500/50 shadow-lg' : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                    >
                      <div className="w-14 h-14 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center p-2 overflow-hidden border border-white/5">
                        {ch.logo ? (
                          <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain drop-shadow-md" loading="lazy" onError={(e)=>{e.target.style.display='none'}} />
                        ) : (
                          <span className="text-xs font-bold text-gray-400 text-center leading-tight break-words">{ch.name.substring(0,8)}</span>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold truncate text-lg ${isActive ? 'text-white' : 'text-gray-200'}`}>{ch.name}</span>
                          {isActive && <Radio size={14} className="text-green-500 animate-pulse ml-2 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center text-xs space-x-2">
                          <span className={`${isActive ? 'text-green-400' : 'text-gray-500'} font-semibold truncate`}>{ch.programs[0].title}</span>
                          {ch.urls.length > 1 && <span className="bg-white/10 text-[9px] px-1.5 py-0.5 rounded text-gray-400">ALT</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                <Search size={40} className="mb-3" />
                <p className="text-lg font-medium">No channels found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}