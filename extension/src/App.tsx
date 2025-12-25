import { useEffect, useState } from 'react'
import type { Note } from './types';
import { supabase } from './supabase';
import NoteList from './components/NoteList';
import Header from './components/Header';
import NoteModal from './components/NoteModal';
import ActionBar from './components/ActionBar';

function App() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string>('');
  const [modalTitle, setModalTitle] = useState<string>('');

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
            setPageTitle(tabs[0].title || '제목 없음');
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
      const { data, error } = await supabase
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  const handleOpenModal = () => {
    setModalUrl(currentUrl);
    setModalTitle(pageTitle);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-[100vh] flex flex-col bg-white relative">
      {/* 헤더 */}
      <Header
        session={session}
        pageTitle={pageTitle}
        currentUrl={currentUrl}
        onLogout={handleLogout}
      />

      {session ? (
        <>
          {/* 액션 바 */}
          <ActionBar
            onAddClick={handleOpenModal}
            onDeleteAll={() => console.log("전체 삭제")}
            onDeleteSelected={() => console.log("선택 삭제")}
          />

          {/* 메모 목록 */}
          <NoteList notes={notes} loading={loading} onRefresh={fetchNotes} />

          {/* 글쓰기 모달 */}
          {isModalOpen && (
            <NoteModal
              pageUrl={modalUrl}
              pageTitle={modalTitle}
              onClose={() => setIsModalOpen(false)}
              onNoteSaved={() => {
                setIsModalOpen(false);
                if (currentUrl === modalUrl) {
                  fetchNotes();
                }
              }}
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-500 text-sm">로그인이 필요합니다.</p>
        </div>
      )}
    </div>
  );
}

export default App
