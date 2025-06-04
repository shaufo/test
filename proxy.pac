function FindProxyForURL(url, host) {
    // 直接连接的主机列表
    if (
        shExpMatch(host, "*.local") ||
        shExpMatch(host, "localhost") ||
        shExpMatch(host, "127.0.0.*") ||
        shExpMatch(host, "192.168.*")
    ) {
        return "DIRECT";
    }

    // 对所有其他域名和IP使用代理链
    return "PROXY 192.168.1.2:7983; PROXY 192.168.1.6:7983";
}    
