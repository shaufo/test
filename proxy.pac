function FindProxyForURL(url, host) {
    // 局域网IP不走代理
    if (
        isInNet(host, "10.0.0.0", "255.0.0.0") ||
        isInNet(host, "172.16.0.0", "255.240.0.0") ||
        isInNet(host, "192.168.0.0", "255.255.0.0") ||
        isPlainHostName(host) ||
        dnsDomainIs(host, ".local")
    ) {
        return "DIRECT";
    }

    // 默认使用主代理，失败则尝试备用代理，最后直连
    return "PROXY 192.168.1.2:7893; PROXY 192.168.1.6:7893; DIRECT";
}
