import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { GoogleDriveService } from '~utils/google-drive';
import { message } from 'antd';

// 添加调试信息
console.log('GoogleAuthContext loaded, chrome.identity available:', !!window.chrome?.identity);

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

interface GoogleAuthContextType {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  loading: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {}
});

export const useGoogleAuth = () => useContext(GoogleAuthContext);

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const driveService = GoogleDriveService.getInstance();

  // 获取用户信息
  const fetchUserInfo = async (token: string) => {
    console.log('Fetching user info with token:', token.substring(0, 5) + '...');
    try {
      // 添加更多调试信息
      console.log('Making request to Google userinfo API...');
      console.log('Request URL: https://www.googleapis.com/oauth2/v1/userinfo?alt=json');
      console.log('Authorization header: Bearer ' + token.substring(0, 5) + '...');
      
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('User info response status:', response.status);
      console.log('User info response headers:', JSON.stringify([...response.headers.entries()]));
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User info fetched successfully:', userData);
        setUser({
          email: userData.email,
          name: userData.name,
          picture: userData.picture
        });
        return true;
      }
      
      const errorText = await response.text();
      console.error('Failed to fetch user info:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      // 显示更具体的错误信息
      if (response.status === 401) {
        message.error('Authentication failed: Token is invalid or expired. Please try logging in again.');
        // 尝试清除缓存的token
        chrome.identity.removeCachedAuthToken({ token }, () => {
          console.log('Removed cached auth token due to 401 error');
        });
      } else {
        message.error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
      }
      
      return false;
    } catch (error) {
      console.error('Error fetching user info:', error);
      message.error('Error fetching user info: ' + (error.message || 'Unknown error'));
      return false;
    }
  };

  // 检查认证状态
  const checkAuthStatus = async () => {
    console.log('Checking auth status...');
    setLoading(true);
    
    if (!window.chrome?.identity) {
      console.error('Chrome identity API not available');
      message.error('Chrome identity API not available');
      setLoading(false);
      return;
    }
    
    try {
      // 获取当前token
      const token = await new Promise<string | null>((resolve) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError) {
            console.log('No active session:', chrome.runtime.lastError);
            resolve(null);
          } else {
            console.log('Got auth token:', token?.substring(0, 5) + '...');
            resolve(token);
          }
        });
      });

      if (token) {
        const userInfoSuccess = await fetchUserInfo(token);
        console.log('User info fetch success:', userInfoSuccess);
        setIsAuthenticated(userInfoSuccess);
      } else {
        console.log('No token available, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (): Promise<boolean> => {
    console.log('Attempting to login...');
    setLoading(true);
    
    if (!window.chrome?.identity) {
      console.error('Chrome identity API not available');
      message.error('Chrome identity API not available');
      setLoading(false);
      return false;
    }
    
    try {
      // 先清除可能存在的缓存token
      await new Promise<void>((resolve) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (token) {
            console.log('Removing existing cached token before login...');
            chrome.identity.removeCachedAuthToken({ token }, () => {
              console.log('Existing token removed');
              resolve();
            });
          } else {
            console.log('No existing token to remove');
            resolve();
          }
        });
      });
      
      console.log('Calling driveService.authenticate()...');
      const success = await driveService.authenticate();
      console.log('Authentication result:', success);
      
      if (success) {
        console.log('Authentication successful, checking auth status...');
        await checkAuthStatus();
        return true;
      } else {
        console.log('Authentication failed');
        message.error('Failed to authenticate with Google. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Login error: ' + (error.message || 'Unknown error'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 退出
  const logout = async (): Promise<void> => {
    console.log('Logging out...');
    setLoading(true);
    
    if (!window.chrome?.identity) {
      console.error('Chrome identity API not available');
      message.error('Chrome identity API not available');
      setLoading(false);
      return;
    }
    
    try {
      // 获取当前token
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          console.log('Removing cached auth token...');
          // 撤销token
          chrome.identity.removeCachedAuthToken({ token }, () => {
            console.log('Token removed, revoking access...');
            // 撤销Google的授权
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
              .then(() => {
                setIsAuthenticated(false);
                setUser(null);
                console.log('Logged out successfully');
              })
              .catch(error => {
                console.error('Error revoking token:', error);
              })
              .finally(() => {
                setLoading(false);
              });
          });
        } else {
          console.log('No token to revoke');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  // 初始化时检查认证状态
  useEffect(() => {
    console.log('GoogleAuthProvider mounted, checking auth status...');
    // 延迟一点检查认证状态，确保Chrome API已加载
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // 监控认证状态变化
  useEffect(() => {
    console.log('Auth state updated:', { isAuthenticated, user, loading });
  }, [isAuthenticated, user, loading]);

  return (
    <GoogleAuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export default GoogleAuthContext; 