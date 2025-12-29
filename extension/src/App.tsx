import { useEffect, useState } from 'react'
import type { Note } from './types';
import { supabase } from './supabase';
import NoteList from './components/memo/NoteList';
import Header from './components/common/Header';
import NoteModal from './components/memo/NoteModal';
import ActionBar from './components/common/ActionBar';
import SplashScreen from './components/common/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string>('');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // 스플래시 화면
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

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

  // 메모 목록
  const fetchNotes = async () => {
    if (!currentUrl || !session?.user?.id) return;
    setLoading(true);
    try {
      const userId = session.user.id;

      // 1. 내가 작성한 메모 (현재 URL)
      const { data: myNotes, error: myError } = await supabase
        .from('notes')
        .select('*, users:writer_id(nickname, avatar_url, email)')
        .eq('page_url', currentUrl)
        .eq('writer_id', userId);

      if (myError) throw myError;

      let allNotes = [...(myNotes || [])];

      // 2. 공유받은 메모 가져오기 (실패해도 내 메모는 보여야 함)
      try {
        const { data: sharedRelations, error: sharedError } = await supabase
          .from('note_shares')
          .select('note_id')
          .eq('guest_id', userId)
          .eq('status', 'ACCEPTED');

        if (sharedError) throw sharedError;

        const sharedNoteIds = sharedRelations?.map(r => r.note_id) || [];

        // 3. 공유받은 메모가 있다면 현재 URL에 해당하는 것만 필터링해서 가져오기
        if (sharedNoteIds.length > 0) {
          const { data: sharedNotes, error: fetchSharedError } = await supabase
            .from('notes')
            .select('*, users:writer_id(nickname, avatar_url, email)')
            .eq('page_url', currentUrl)
            .in('note_id', sharedNoteIds);

          if (fetchSharedError) throw fetchSharedError;
          if (sharedNotes) {
            allNotes = [...allNotes, ...sharedNotes];
          }
        }
      } catch (sharedErr) {
        console.warn("공유 메모 불러오기 실패 (무시됨):", sharedErr);
      }

      // 날짜 순 정렬
      allNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotes(allNotes as any[]);
    }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  // 메모 편집
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  // 메모 선택
  const toggleSelection = (noteId: number) => {
    const newSet = new Set(selectedNotes);
    if (newSet.has(noteId)) newSet.delete(noteId);
    else newSet.add(noteId);
    setSelectedNotes(newSet);
  };

  // 선택 메모 삭제
  const handleDeleteSelected = async () => {
    if (selectedNotes.size === 0) return;
    if (!confirm(`${selectedNotes.size}개의 메모를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .in('note_id', Array.from(selectedNotes));

      if (error) throw error;
      setSelectedNotes(new Set());  // 선택 초기화
      setIsSelectionMode(false);
      fetchNotes();
    } catch (e) { console.error(e); alert('삭제 실패'); }
  };

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (notes.length === 0) return;
    if (!confirm('현재 페이지의 모든 메모를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('page_url', currentUrl)
        .eq('writer_id', session.user.id);

      if (error) throw error;
      fetchNotes();
    } catch (e) { console.error(e); alert('삭제 실패'); }
  };

  return (
    <div className="w-full h-[100vh] flex flex-col bg-white relative">

      {/* 스플래시 화면 */}
      {showSplash && <SplashScreen isFadingOut={isFadingOut} />}

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
            onAddClick={() => {
              setModalUrl(currentUrl);
              setModalTitle(pageTitle);
              setEditingNote(null);
              setIsModalOpen(true);
            }}
            onDeleteAll={handleDeleteAll}
            onDeleteSelected={handleDeleteSelected}
            isSelectionMode={isSelectionMode}
            onEnterSelectionMode={() => setIsSelectionMode(true)}
            onExitSelectionMode={() => {
              setIsSelectionMode(false);
              setSelectedNotes(new Set());
            }}
            selectedCount={selectedNotes.size}
          />

          {/* 메모 목록 */}
          <NoteList
            notes={notes}
            loading={loading}
            onRefresh={fetchNotes}
            onEditNote={handleEditNote}
            selectedNotes={selectedNotes}
            onToggleSelect={toggleSelection}
            isSelectionMode={isSelectionMode}
            userId={session?.user?.id}
          />

          {/* 글쓰기 모달 */}
          {isModalOpen && (
            <NoteModal
              pageUrl={modalUrl}
              pageTitle={modalTitle}
              noteToEdit={editingNote}
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
