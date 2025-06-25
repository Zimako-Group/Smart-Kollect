'use client';

import { useRedux } from '@/hooks/useRedux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { openDialer, startCall } from '@/lib/redux/features/dialer/dialerSlice';
import { markPTPResolved } from '@/lib/redux/features/accounts/accountsSlice';
import { markReminderComplete } from '@/lib/redux/features/reminders/remindersSlice';
import { resolveFlag } from '@/lib/redux/features/flags/flagsSlice';

export function ReduxExample() {
  const { dispatch, select, dialer, user, accounts, reminders, flags } = useRedux();
  
  // Get state from Redux store
  const isDialerOpen = dialer.isOpen();
  const callState = dialer.callState();
  const userProfile = user.profile();
  const userPerformance = user.performance();
  const accountMetrics = accounts.metrics();
  const reminderMetrics = reminders.metrics();
  const flagsByPriority = flags.byPriority();
  
  // Example handlers for dispatching actions
  const handleOpenDialer = () => {
    dispatch(openDialer());
  };
  
  const handleStartCall = () => {
    dispatch(startCall({
      customerName: 'John Doe',
      phoneNumber: '0123456789',
      accountId: 'ACC123'
    }));
  };
  
  const handleMarkPTPResolved = () => {
    // Example account ID
    dispatch(markPTPResolved('ACC123'));
  };
  
  const handleMarkReminderComplete = () => {
    // Example reminder ID
    dispatch(markReminderComplete('REM123'));
  };
  
  const handleResolveFlag = () => {
    // Example flag ID
    dispatch(resolveFlag('FLAG123'));
  };
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Redux Example</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dialer State</CardTitle>
            <CardDescription>Current state of the dialer component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-semibold">Dialer Open:</span> {isDialerOpen ? 'Yes' : 'No'}</p>
              <p><span className="font-semibold">Call State:</span> {callState}</p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleOpenDialer}>Open Dialer</Button>
            <Button onClick={handleStartCall} variant="outline">Start Call</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Current user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-semibold">Name:</span> {userProfile.name || 'Not set'}</p>
              <p><span className="font-semibold">Role:</span> {userProfile.role || 'Not set'}</p>
              <p><span className="font-semibold">Collection Rate:</span> {userPerformance.collectionRate}%</p>
              <p><span className="font-semibold">Cases Resolved:</span> {userPerformance.casesResolved}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Metrics</CardTitle>
            <CardDescription>Allocated accounts information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-semibold">Total Accounts:</span> {accountMetrics.totalAccounts}</p>
              <p><span className="font-semibold">Total Value:</span> R{accountMetrics.totalValue.toLocaleString()}</p>
              <p><span className="font-semibold">Overdue Accounts:</span> {accountMetrics.overdueAccounts}</p>
              <p><span className="font-semibold">Contact Rate:</span> {accountMetrics.contactRate}%</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleMarkPTPResolved}>Mark PTP Resolved</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reminders & Flags</CardTitle>
            <CardDescription>Current reminders and flags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Reminders</h3>
                <p><span className="font-semibold">Today:</span> {reminderMetrics.today}</p>
                <p><span className="font-semibold">This Week:</span> {reminderMetrics.week}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Flags</h3>
                <p><span className="font-semibold">High Priority:</span> {flagsByPriority.high.length}</p>
                <p><span className="font-semibold">Medium Priority:</span> {flagsByPriority.medium.length}</p>
                <p><span className="font-semibold">Low Priority:</span> {flagsByPriority.low.length}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleMarkReminderComplete} variant="outline">Complete Reminder</Button>
            <Button onClick={handleResolveFlag} variant="outline">Resolve Flag</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
