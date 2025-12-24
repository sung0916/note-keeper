import { useEffect, useState } from 'react'
import type { Note } from './types';
import { supabase } from './supabase';
import NoteList from './components/NoteList';
import NoteInput from './components/NoteInput';
import AuthButton from './components/AuthButton';

function App() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  // 초기 세션 및 URL 가져오기 & URL 감지
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const updateUrl = () => {
      if (chrome?.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            setCurrentUrl(tabs[0].url);
          }
        });
      }
    };
    updateUrl();

    const handleTabActivated = () => updateUrl();
    const handleTabUpdated = (
      _tabId: number,
      changeInfo: any,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === 'complete' && tab.active) {
        updateUrl();
      }
    };

    if (chrome?.tabs) {
      chrome.tabs.onActivated.addListener(handleTabActivated);
      chrome.tabs.onUpdated.addListener(handleTabUpdated);
    } 

    return () => {
      if (chrome?.tabs) {
        chrome.tabs.onActivated.removeListener(handleTabActivated);
        chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      }
    };
  }, []);

  // URL이나 세션이 바뀌면 메모 목록 새로고침
  useEffect(() => {
    if (currentUrl && session) {
      fetchNotes();
    }
  }, [currentUrl, session]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const {data, error} = await supabase
      .from('notes')
      .select('*')
      .eq('page_url', currentUrl)
      .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } 
    catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  return (
    <div className="w-full h-[100vh] flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <div className="text-xs">
           {/* 로그인 버튼은 작게 넣거나 메뉴로 뺄 수 있음 */}
           <AuthButton /> 
        </div>
      </div>

      {!session ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-sm text-gray-500">
            로그인이 필요합니다.<br />
            상단 버튼을 눌러 로그인해주세요.
          </p>
        </div>
      ) : (
        <>
          {/* 현재 URL 표시 (디버깅용, 나중에 숨겨도 됨) */}
          <div className="px-4 py-1 bg-blue-50 text-xs text-blue-600 truncate border-b">
            🔗 {currentUrl}
          </div>

          {/* 입력창 */}
          <NoteInput pageUrl={currentUrl} onNoteSaved={fetchNotes} />

          {/* 목록 */}
          <NoteList notes={notes} loading={loading} />
        </>
      )}
    </div>
  );
}

export default App
