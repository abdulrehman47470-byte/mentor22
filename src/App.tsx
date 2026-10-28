import { Suspense, lazy, useEffect, type ComponentType, type JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, Device, RequireStudent } from '@/components/shell';
import { DialogHost, Offline, Toaster, UpdateBanner } from '@/components/ui';
import { BootSplash, Start, Welcome } from '@/pages/landing';

const preloads: (() => Promise<unknown>)[] = [];

/**
 * Code-split page. The landing page ships alone; every other page downloads in the background once the
 * browser is idle, and after that renders synchronously, so navigating never waits or flashes.
 */
function page<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  type P = M[K] extends ComponentType<infer X> ? X : never;
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;
  const get = () => (pending ??= load().then((m) => (Loaded = m[name] as ComponentType<P>)));
  preloads.push(get);
  const Lazy = lazy(() => get().then((C) => ({ default: C })));
  return (props: P & JSX.IntrinsicAttributes) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
}

const auth = () => import('@/pages/auth');
const home = () => import('@/pages/home');
const calendar = () => import('@/pages/calendar');
const chat = () => import('@/pages/chat');
const profile = () => import('@/pages/profile');
const settings = () => import('@/pages/settings');

const Login = page(auth, 'Login');
const ForgotPassword = page(auth, 'ForgotPassword');
const CreatePassword = page(auth, 'CreatePassword');
const Verify = page(auth, 'Verify');
const UploadPhoto = page(auth, 'UploadPhoto');
const SelectCollege = page(auth, 'SelectCollege');
const EducationalNotice = page(auth, 'EducationalNotice');
const Home = page(home, 'Home');
const Search = page(home, 'Search');
const MentorProfile = page(home, 'MentorProfile');
const Requests = page(() => import('@/pages/requests'), 'Requests');
const Calendar = page(calendar, 'Calendar');
const ScheduleMeeting = page(calendar, 'ScheduleMeeting');
const Availability = page(calendar, 'Availability');
const ChatList = page(chat, 'ChatList');
const ChatThread = page(chat, 'ChatThread');
const Call = page(() => import('@/pages/call'), 'Call');
const MyProfile = page(profile, 'MyProfile');
const EditProfile = page(profile, 'EditProfile');
const Settings = page(settings, 'Settings');
const ResourcesMenu = page(settings, 'ResourcesMenu');
const Training = page(settings, 'Training');
const CollegeResources = page(settings, 'CollegeResources');
const ResetPassword = page(settings, 'ResetPassword');
const AccessibilityPage = page(settings, 'AccessibilityPage');
const HelpSupport = page(settings, 'HelpSupport');
const Policy = page(settings, 'Policy');
const Notifications = page(settings, 'Notifications');

const student = (el: React.ReactNode) => <RequireStudent>{el}</RequireStudent>;

/** New screens start at the top. */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('scroller')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Spinner() {
  return (
    <div className="grid min-h-app place-items-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-[3px] border-brand-light border-t-brand" />
    </div>
  );
}

export function App() {
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    idle(() => preloads.forEach((p) => p()));
  }, []);
  return (
    <BrowserRouter>
      <Device>
        <ScrollTop />
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/upload-photo" element={<UploadPhoto />} />
            <Route path="/select-college" element={<SelectCollege />} />
            <Route path="/educational-notice" element={<EducationalNotice />} />
            <Route path="/policy/:key" element={<Policy />} />
            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/chat" element={<ChatList />} />
              <Route path="/profile" element={<MyProfile />} />
            </Route>
            <Route path="/search" element={student(<Search />)} />
            <Route path="/mentor/:id" element={student(<MentorProfile />)} />
            <Route path="/chat/:id" element={student(<ChatThread />)} />
            <Route path="/call/:id" element={student(<Call />)} />
            <Route path="/schedule/:id?" element={student(<ScheduleMeeting />)} />
            <Route path="/availability" element={student(<Availability />)} />
            <Route path="/profile/edit" element={student(<EditProfile />)} />
            <Route path="/notifications" element={student(<Notifications />)} />
            <Route path="/settings" element={student(<Settings />)} />
            <Route path="/settings/resources" element={student(<ResourcesMenu />)} />
            <Route path="/settings/training" element={student(<Training />)} />
            <Route path="/settings/college-resources" element={student(<CollegeResources />)} />
            <Route path="/settings/reset-password" element={student(<ResetPassword />)} />
            <Route path="/settings/accessibility" element={student(<AccessibilityPage />)} />
            <Route path="/settings/help" element={student(<HelpSupport />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <DialogHost />
        <Toaster />
        <UpdateBanner />
        <Offline />
        <BootSplash />
      </Device>
    </BrowserRouter>
  );
}
