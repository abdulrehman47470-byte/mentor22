import { Suspense, lazy, useEffect, type ComponentType, type JSX } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell, Frame, RequireAdmin, RequireMember } from '@/components/shell';
import { DialogHost, Offline, Toaster, UpdateBanner } from '@/components/ui';
import { BootSplash, BrandLoader, Start, Welcome } from '@/pages/landing';
import { IncomingCall, LiveRoomPage } from '@/pages/calls';

const preloads: (() => Promise<unknown>)[] = [];

/**
 * Code-split page. The landing page ships first; every other page downloads in the background once the
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
const profileWizard = () => import('@/pages/profile-wizard');
const home = () => import('@/pages/home');
const profile = () => import('@/pages/profile');
const messages = () => import('@/pages/messages');
const meetings = () => import('@/pages/meetings');
const settings = () => import('@/pages/settings');

const Login = page(auth, 'Login');
const ForgotPassword = page(auth, 'ForgotPassword');
const CreatePassword = page(auth, 'CreatePassword');
const Verify = page(auth, 'Verify');
const UploadPhoto = page(auth, 'UploadPhoto');
const SelectCollege = page(auth, 'SelectCollege');
const EducationalNotice = page(auth, 'EducationalNotice');
const ProfileWizard = page(profileWizard, 'ProfileWizard');
const Discover = page(home, 'Discover');
const Search = page(home, 'Search');
const MemberProfile = page(profile, 'MemberProfile');
const MyProfile = page(profile, 'MyProfile');
const MyProfileView = page(profile, 'MyProfileView');
const Connections = page(() => import('@/pages/connections'), 'Connections');
const Chat = page(messages, 'Chat');
const Messages = page(messages, 'Messages');
const Call = page(messages, 'Call');
const Availability = page(meetings, 'Availability');
const Meetings = page(meetings, 'Meetings');
const NewMeeting = page(meetings, 'NewMeeting');
const Blocked = page(settings, 'Blocked');
const Legal = page(settings, 'Legal');
const Notifications = page(settings, 'Notifications');
const Resources = page(settings, 'Resources');
const Settings = page(settings, 'Settings');
const ResourcesMenu = page(settings, 'ResourcesMenu');
const Training = page(settings, 'Training');
const ResetPassword = page(settings, 'ResetPassword');
const AccessibilityPage = page(settings, 'AccessibilityPage');
const HelpSupport = page(settings, 'HelpSupport');
const Admin = page(() => import('@/pages/admin'), 'Admin');
const InvitePage = page(() => import('@/pages/invite'), 'InvitePage');

const member = (el: React.ReactNode) => <RequireMember>{el}</RequireMember>;

/** New screens start at the top. */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('scroller')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
    idle(() => preloads.forEach((p) => p()));
  }, []);
  return (
    <BrowserRouter>
      <Frame>
        <ScrollTop />
        <Suspense fallback={<BrandLoader />}>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/welcome" element={<Welcome />} />
            {/* Sign-in flow (content document, section 3) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-password" element={<CreatePassword />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/upload-photo" element={<UploadPhoto />} />
            <Route path="/onboarding/photo" element={<Navigate to="/upload-photo" replace />} />
            <Route path="/select-college" element={<SelectCollege />} />
            <Route path="/educational-notice" element={<EducationalNotice />} />
            <Route path="/onboarding/profile" element={<ProfileWizard mode="setup" />} />
            {/* Bottom menu: Home, Requests, Calendar, Chat, Profile (+ Admin for Super Admins) */}
            <Route element={<AppShell />}>
              <Route path="/home" element={<Navigate to="/discover" replace />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/requests" element={<Navigate to="/connections" replace />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/calendar" element={<Navigate to="/meetings" replace />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat" element={<Navigate to="/messages" replace />} />
              <Route path="/profile" element={<MyProfile />} />
            </Route>
            <Route path="/search" element={member(<Search />)} />
            <Route path="/invite" element={member(<InvitePage />)} />
            <Route path="/admin" element={member(<RequireAdmin><Admin /></RequireAdmin>)} />
            <Route path="/member/:id" element={member(<MemberProfile />)} />
            <Route path="/messages/:id" element={member(<Chat />)} />
            <Route path="/call/:id" element={member(<Call />)} />
            <Route path="/room/:id" element={member(<LiveRoomPage />)} />
            <Route path="/meetings/new/:id" element={member(<NewMeeting />)} />
            <Route path="/availability" element={member(<Availability />)} />
            <Route path="/profile/view" element={member(<MyProfileView />)} />
            <Route path="/profile/edit" element={member(<ProfileWizard mode="edit" />)} />
            <Route path="/notifications" element={member(<Notifications />)} />
            <Route path="/settings" element={member(<Settings />)} />
            <Route path="/settings/resources" element={member(<ResourcesMenu />)} />
            <Route path="/settings/training" element={member(<Training />)} />
            <Route path="/settings/reset-password" element={member(<ResetPassword />)} />
            <Route path="/settings/accessibility" element={member(<AccessibilityPage />)} />
            <Route path="/settings/help" element={member(<HelpSupport />)} />
            <Route path="/resources" element={member(<Resources />)} />
            <Route path="/blocked" element={member(<Blocked />)} />
            {/* Policy pages are public (linked from the landing page) */}
            <Route path="/policy/:key" element={<Legal />} />
            <Route path="/legal/:key" element={<Legal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <IncomingCall />
        <DialogHost />
        <Toaster />
        <UpdateBanner />
        <Offline />
        <BootSplash />
      </Frame>
    </BrowserRouter>
  );
}
