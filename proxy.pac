function FindProxyForURL(url, host) {
    // 直接连接的主机列表
    if (
        shExpMatch(host, "*.local") ||
        shExpMatch(host, "localhost") ||
        shExpMatch(host, "127.0.0.*") ||
        shExpMatch(host, "192.168.*") ||
        shExpMatch(host, "10.*") ||
        shExpMatch(host, "172.16.*") ||
        shExpMatch(host, "172.17.*") ||
        shExpMatch(host, "172.18.*") ||
        shExpMatch(host, "172.19.*") ||
        shExpMatch(host, "172.20.*") ||
        shExpMatch(host, "172.21.*") ||
        shExpMatch(host, "172.22.*") ||
        shExpMatch(host, "172.23.*") ||
        shExpMatch(host, "172.24.*") ||
        shExpMatch(host, "172.25.*") ||
        shExpMatch(host, "172.26.*") ||
        shExpMatch(host, "172.27.*") ||
        shExpMatch(host, "172.28.*") ||
        shExpMatch(host, "172.29.*") ||
        shExpMatch(host, "172.30.*") ||
        shExpMatch(host, "172.31.*")
    ) {
        return "DIRECT";
    }

    // 示例：对特定域名使用代理
    if (
        shExpMatch(host, "*.example.com") ||
        shExpMatch(host, "internal-site.com")
    ) {
        return "PROXY 192.168.1.2:7983; PROXY 192.168.1.6:7983";
    }

    // 默认使用代理链，浏览器会自动尝试第一个，失败则尝试第二个
    return "PROXY 192.168.1.2:7983; PROXY 192.168.1.6:7983";
}    